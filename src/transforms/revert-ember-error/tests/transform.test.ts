import runTestCases from "../../../utils/testHelper";
import transform, { parser } from "#transforms/revert-ember-error/index.js";

const testCases = [
  {
    name: "should handle revert-ember-error import and usage in javascript",
    input: "transform.input.js",
    output: "transform.output.js",
  },
  {
    name: "should handle revert-ember-error import and usage in typescript",
    input: "transform.input.ts",
    output: "transform.output.ts",
  },
];

runTestCases("revert-ember-error", __dirname, testCases, transform, parser);
