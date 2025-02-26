import type { API, FileInfo } from "jscodeshift";
import { Options } from "jscodeshift";

export const parser = "ts";

export default function transformer(
  fileInfo: FileInfo,
  api: API,
  options: Options,
) {
  const j = api.jscodeshift;

  // Get the root of the current file's AST
  const root = j(fileInfo.source, options);

  const emberDefaultUsages = root
    .find(j.Identifier)
    .filter((path) => path.value.name === "Ember");

  const emberImports = root
    .find(j.ImportDeclaration)
    .filter((path) => path.value.source.value === "ember");

  const hasDefaultEmberImport = emberImports
    .find(j.ImportDefaultSpecifier)
    .some((path) => path.value.local?.name === "Ember");

  if (emberDefaultUsages.length > 0 && !hasDefaultEmberImport) {
    const emberImportDefaultSpecifier = j.importDefaultSpecifier(
      j.identifier("Ember"),
    );

    if (emberImports.length > 0) {
      const firstImport = emberImports.at(0);

      firstImport.replaceWith((path) => {
        return j.importDeclaration(
          [emberImportDefaultSpecifier, ...(path.value.specifiers ?? [])],
          path.value.source,
        );
      });
    } else {
      const defaultEmberImport = j.importDeclaration(
        [emberImportDefaultSpecifier],
        j.literal("ember"),
      );

      const allImports = root.find(j.ImportDeclaration);

      if (allImports.length) {
        const lastImport = allImports.at(-1);

        lastImport.insertAfter(defaultEmberImport);
      } else {
        // Insert ember import at the top of the file if there are no imports
        root
          .find(j.Program)
          .replaceWith((programNode) =>
            j.program([defaultEmberImport, ...programNode.value.body]),
          );
      }
    }
  }

  // Return the modified code
  return root.toSource({ quote: "single", objectCurlySpacing: false });
}
