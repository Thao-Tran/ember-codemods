import { parse, CssSyntaxError } from "postcss";
import type { FileInfo } from "jscodeshift";

export default function transform(fileInfo: FileInfo) {
  if (
    !fileInfo.path.includes("dummy/app") &&
    fileInfo.path.includes("addon/styles/addon.scss")
  ) {
    try {
      const ast = parse(fileInfo.source);

      let modified = false;

      ast.walkAtRules((node) => {
        if (
          node.params.includes("node_modules/@frost-styles/scss/scss/styles")
        ) {
          node.params = node.params.replace("scss/styles", "scss/variables");
          modified = true;
        }
      });

      if (modified) {
        return ast.toResult().css;
      }
    } catch (e) {
      if (e instanceof CssSyntaxError) {
        console.error(
          `Syntax error in ${fileInfo.path} on line ${e.line}: ${e.reason}`,
        );
      } else {
        console.error(e);
      }
      throw e;
    }
  }
}
