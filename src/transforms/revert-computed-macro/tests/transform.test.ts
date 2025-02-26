import runTestCases from "../../../utils/testHelper";
import transform, { parser } from "#transforms/revert-computed-macro/index.js";

const testCases = [
  {
    name: "should handle ember-macro-helper/computed import and usage in javascript",
    input: "transform.input.js",
    output: "transform.output.js",
  },
  {
    name: "should handle ember-macro-helper/computed import and usage in typescript",
    input: "transform.input.js",
    output: "transform.output.js",
  },
];

runTestCases(
  "ember-macro-helper/computed",
  __dirname,
  testCases,
  transform,
  parser,
);
