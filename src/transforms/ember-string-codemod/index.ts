import type {
  FileInfo,
  API,
  JSCodeshift,
  Collection,
  ImportSpecifier,
  Options,
  ASTPath,
} from "jscodeshift";

export const parser = "ts";

function handleConfigFile({
  root,
  j,
}: {
  j: JSCodeshift;
  root: Collection<ASTPath>;
}) {
  const envConstantName = root
    .find(j.ReturnStatement)
    .find(j.Identifier)
    .nodes()[0]?.name;

  const envDeclarator = root
    .find(j.VariableDeclarator)
    .filter(
      (node) =>
        node.value.id.type === "Identifier" &&
        node.value.id.name === envConstantName,
    );

  if (envDeclarator.length > 0) {
    const emberEnvProp = envDeclarator
      .find(j.ObjectProperty)
      .filter(
        (node) =>
          node.value.key.type === "Identifier" &&
          node.value.key.name === "EmberENV",
      );

    const stringProtoPropReplacement = j.objectProperty(
      j.identifier("String"),
      j.literal(false),
    );

    const extendProtoPropReplacement = j.objectProperty(
      j.identifier("EXTEND_PROTOTYPES"),
      j.objectExpression([stringProtoPropReplacement]),
    );

    if (emberEnvProp.length > 0) {
      const extendProtoProp = emberEnvProp
        .find(j.ObjectProperty)
        .filter(
          (node) =>
            node.value.key.type === "Identifier" &&
            node.value.key.name === "EXTEND_PROTOTYPES",
        );

      if (extendProtoProp.length > 0) {
        const stringProtoProp = extendProtoProp
          .find(j.ObjectProperty)
          .filter(
            (node) =>
              node.value.key.type === "Identifier" &&
              node.value.key.name === "String",
          );

        if (stringProtoProp.length > 0) {
          stringProtoProp.replaceWith(stringProtoPropReplacement);
        } else {
          extendProtoProp
            .find(j.ObjectExpression)
            .nodes()[0]
            .properties.push(stringProtoPropReplacement);
        }
      } else {
        emberEnvProp
          .find(j.ObjectExpression)
          .nodes()[0]
          .properties.push(extendProtoPropReplacement);
      }
    } else {
      envDeclarator
        .find(j.ObjectExpression)
        .nodes()[0]
        .properties.push(
          j.objectProperty(
            j.identifier("EmberENV"),
            j.objectExpression([extendProtoPropReplacement]),
          ),
        );
    }
  }

  return root.toSource({ quote: "single", objectCurlySpacing: false });
}

export default function transformer(
  fileInfo: FileInfo,
  api: API,
  options: Options,
) {
  const j: JSCodeshift = api.jscodeshift;
  const root = j(fileInfo.source, options);

  // Disable String prototype extensions in the config file
  if (fileInfo.path.includes("config/environment.js")) {
    return handleConfigFile({ j, root });
  }

  const stringMethods: string[] = [
    "capitalize",
    "camelize",
    "classify",
    "decamelize",
    "dasherize",
    "underscore",
    "w",
  ];
  const templateMethods: string[] = ["htmlSafe", "isHTMLSafe"];
  const allMethods: string[] = [...stringMethods, ...templateMethods];
  const usedStringMethods = new Set<string>();
  const usedTemplateMethods = new Set<string>();

  let aliasName = "";

  // Find destructurings from Ember
  const emberDestructurings = root.find(j.VariableDeclarator, {
    init: { name: "Ember" },
    id: { type: "ObjectPattern" },
  });

  // Iterate over each destructuring assignment
  emberDestructurings.forEach((destructuringPath) => {
    // @ts-expect-error jscodeshfit
    const stringAlias = destructuringPath.node.id.properties.find(
      // @ts-expect-error jscodeshfit
      (prop) => prop.key.name === "String" && prop.type === "ObjectProperty",
    );

    if (stringAlias) {
      aliasName = stringAlias.value.name;
    }
  });

  // Replace usage of Ember.String methods and destructured String methods
  allMethods.forEach((method) => {
    root
      .find(j.CallExpression, {
        callee: {
          type: "MemberExpression",
          object: {
            object: { name: "Ember" },
            property: { name: "String" },
          },
          property: { name: method },
        },
      })
      .replaceWith((path) => {
        // Add the method to the appropriate set
        if (stringMethods.includes(method)) {
          usedStringMethods.add(method);
        } else {
          usedTemplateMethods.add(method);
        }
        return j.callExpression(j.identifier(method), path.node.arguments);
      });

    root
      .find(j.CallExpression, {
        callee: {
          type: "MemberExpression",
          object: { name: aliasName },
          property: { name: method },
        },
      })
      .replaceWith((path) => {
        // Add the method to the appropriate set
        if (stringMethods.includes(method)) {
          usedStringMethods.add(method);
        } else {
          usedTemplateMethods.add(method);
        }
        return j.callExpression(j.identifier(method), path.node.arguments);
      });
  });

  // Track already imported methods from @ember/string and @ember/template
  root.find(j.ImportDeclaration).forEach((path) => {
    if (Array.isArray(path.value.specifiers)) {
      if (path.value.source.value === "@ember/string") {
        path.value.specifiers.forEach((specifier) => {
          if (specifier.local && stringMethods.includes(specifier.local.name)) {
            usedStringMethods.add(specifier.local.name);
          }
        });
      } else if (path.value.source.value === "@ember/template") {
        path.value.specifiers.forEach((specifier) => {
          if (
            specifier.local &&
            templateMethods.includes(specifier.local.name)
          ) {
            usedTemplateMethods.add(specifier.local.name);
          }
        });
      }
    }
  });

  // Find and replace all specified method calls
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        property: {
          type: "Identifier",
          name: (name: string) => allMethods.includes(name),
        },
      },
    })
    .forEach((path) => {
      // Check if the method is called on lodash object
      if (
        // @ts-expect-error jscodeshfit
        path.value.callee.object.type === "Identifier" &&
        // @ts-expect-error jscodeshfit
        path.value.callee.object.name === "_"
      ) {
        // Skip modification for lodash methods
        return;
      }

      // @ts-expect-error jscodeshfit
      const methodName = path.value.callee.property.name;
      const methodSet = stringMethods.includes(methodName)
        ? usedStringMethods
        : usedTemplateMethods;
      if (!methodSet.has(methodName)) {
        methodSet.add(methodName);
      }

      // @ts-expect-error jscodeshfit
      const calleeObject = path.value.callee.object;
      let newArguments = [calleeObject];

      if (calleeObject.type === "Literal") {
        // Handling string literals specifically
        newArguments = [j.literal(calleeObject.value)];
      }

      const newCallee = j.identifier(methodName);
      const newCallExpression = j.callExpression(newCallee, newArguments);
      j(path).replaceWith(newCallExpression);
    });

  // Track already imported methods and update imports or add new ones as necessary
  const updateOrAddImport = (
    source: Collection,
    importSet: Set<string>,
    moduleName: string,
  ) => {
    const existingImport = root.find(j.ImportDeclaration, {
      source: { value: moduleName },
    });

    if (existingImport.size() > 0) {
      // There's already an import from the module
      const existingSpecifiers = existingImport.get(0).node.specifiers;
      const existingImports = new Set(
        existingSpecifiers.map((spec: ImportSpecifier) => {
          if (spec.local) {
            return spec.local.name;
          }
        }),
      );

      importSet.forEach((method) => {
        if (!existingImports.has(method)) {
          existingSpecifiers.push(
            j.importSpecifier(j.identifier(method), j.identifier(method)),
          );
        }
      });
    } else if (importSet.size > 0) {
      // No import from the module yet, and we have methods to import
      const importDeclaration = j.importDeclaration(
        Array.from(importSet).map((method) =>
          j.importSpecifier(j.identifier(method), j.identifier(method)),
        ),
        j.literal(moduleName),
      );
      root.find(j.Program).get("body", 0).insertBefore(importDeclaration);
    }
  };

  // Apply import updates or additions
  updateOrAddImport(root, usedStringMethods, "@ember/string");
  updateOrAddImport(root, usedTemplateMethods, "@ember/template");

  // Remove destructuring if no longer needed
  root
    .find(j.VariableDeclarator)
    // @ts-expect-error jscodeshfit
    .filter((path) => {
      return (
        path.node.init &&
        // @ts-expect-error jscodeshfit
        path.node.init.name === "Ember" &&
        path.node.id.type === "ObjectPattern" &&
        // @ts-expect-error jscodeshfit
        path.node.id.properties.some((prop) => prop.key.name === "String")
      );
    })
    .forEach((path) => {
      // @ts-expect-error jscodeshfit
      if (path.node.id.properties.length === 1) {
        j(path.parentPath.parentPath).remove(); // Remove the whole declaration if 'String' is the only destructured property
      } else {
        // @ts-expect-error jscodeshfit
        path.node.id.properties = path.node.id.properties.filter(
          // @ts-expect-error jscodeshfit
          (prop) => prop.key.name !== "String",
        );
      }
    });

  return root.toSource({ quote: "single", objectCurlySpacing: false });
}
