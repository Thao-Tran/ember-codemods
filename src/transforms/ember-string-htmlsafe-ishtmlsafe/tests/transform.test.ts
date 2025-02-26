import runTestCases from "../../../utils/testHelper";
import transform, {
  parser,
} from "#transforms/ember-string-htmlsafe-ishtmlsafe/index.js";

const testCases = [
  {
    name: "should handle ember-string-htmlsafe-ishtmlsafe import and usage in javascript",
    input: "transform.input.js",
    output: "transform.output.js",
  },
  {
    name: "should handle ember-string-htmlsafe-ishtmlsafe import and usage in typescript",
    input: "transform.input.ts",
    output: "transform.output.ts",
  },
];

runTestCases(
  "ember-string-htmlsafe-ishtmlsafe",
  __dirname,
  testCases,
  transform,
  parser,
);
