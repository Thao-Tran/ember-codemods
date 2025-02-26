import type { API, FileInfo, ImportSpecifier } from "jscodeshift";
import { Options } from "jscodeshift";

export const parser = "ts";

export default function transformer(
  fileInfo: FileInfo,
  api: API,
  options: Options,
) {
  const j = api.jscodeshift;

  return j(fileInfo.source, options)
    .find(j.ImportDeclaration, {
      source: {
        value: "@ember/string",
      },
    })
    .forEach((path) => {
      const newSpecifiers: ImportSpecifier[] = [];

      if (Array.isArray(path.node.specifiers)) {
        path.node.specifiers.forEach((specifier) => {
          if (
            specifier.local &&
            (specifier.local.name === "htmlSafe" ||
              specifier.local.name === "isHTMLSafe")
          ) {
            newSpecifiers.push(
              j.importSpecifier(
                j.identifier(specifier.local.name),
                j.identifier(specifier.local.name),
              ),
            );
          }
        });

        if (newSpecifiers.length > 0) {
          const existingTemplateImport = j(path.parentPath)
            .find(j.ImportDeclaration)
            .filter(
              (templatePath) =>
                templatePath.value.source.value === "@ember/template",
            )
            .at(0);

          if (existingTemplateImport.size() > 0) {
            // Add to existing @ember/template import
            const specifiers = existingTemplateImport.get("specifiers").value;

            specifiers.push(...newSpecifiers);

            // Remove the moved specifiers from the original import
          } else {
            // Create a new import from '@ember/template'
            const newImport = j.importDeclaration(
              newSpecifiers,
              j.literal("@ember/template"),
            );
            j(path).insertAfter(newImport);
          }
          path.node.specifiers = path.node.specifiers.filter(
            (specifier) =>
              specifier.local &&
              specifier.local.name !== "htmlSafe" &&
              specifier.local.name !== "isHTMLSafe",
          );

          // If no specifiers left, remove the whole import
          if (path.node.specifiers.length === 0) {
            j(path).remove();
          }
        }
      }
    })
    .toSource({
      quote: "single",
      objectCurlySpacing: false,
    });
}
