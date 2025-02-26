import runTestCases from "../../../utils/testHelper";
import transform, { parser } from "#transforms/ember-string-codemod/index.js";

const testCases = [
  {
    name: "should handle ember-string-codemod import and usage in javascript",
    input: "destructuring.input.js",
    output: "destructuring.output.js",
  },
  {
    name: "should handle ember-string-codemod import and usage in javascript",
    input: "transform.input.js",
    output: "transform.output.js",
  },
  {
    name: "should handle ember-string-codemod import and usage in typescript",
    input: "transform.input.ts",
    output: "transform.output.ts",
  },
];

runTestCases("ember-string-codemod", __dirname, testCases, transform, parser);
