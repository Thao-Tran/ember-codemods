import type { API, FileInfo } from "jscodeshift";
import { Options } from "jscodeshift";

export const parser = "ts";

/**
 * TODO:
 * Determine if want to use get instead of getProperties
 * Handle class based decorators version(? do we have any usages like this?). Think it's mainly classic
 */

export default function transformer(
  fileInfo: FileInfo,
  api: API,
  options: Options,
) {
  const j = api.jscodeshift;

  // Get the root of the current file's AST
  const root = j(fileInfo.source, options);

  // Find import declaration for EmberError
  const importDeclaration = root.find(j.ImportDeclaration, {
    source: {
      type: "StringLiteral",
      value: "@ember/error",
    },
  });

  let emberErrorImported = false;

  // Check if the specific import is found
  importDeclaration.forEach((p) => {
    // Ensure specifiers is defined and is an array
    const specifiers = p.node.specifiers;
    if (Array.isArray(specifiers)) {
      specifiers.forEach((spec) => {
        if (spec.local && spec.local.name === "EmberError") {
          emberErrorImported = true;

          // Remove the import if it's an unused variable
          if (specifiers.length === 1) {
            j(p).remove();
          } else {
            // Remove only EmberError specifier
            j(p).replaceWith(
              j.importDeclaration(
                specifiers.filter(
                  (s) => s.local && s.local.name !== "EmberError",
                ),
                p.node.source,
              ),
            );
          }
        }
      });
    }
  });

  // If EmberError was imported, replace its usage
  if (emberErrorImported) {
    root
      .find(j.NewExpression, {
        callee: {
          name: "EmberError",
        },
      })
      .replaceWith((path) => {
        return j.newExpression(j.identifier("Error"), path.node.arguments);
      });
  }

  // Return the modified code
  return root.toSource({ quote: "single", objectCurlySpacing: false });
}
