import runTestCases from "#utils/testHelper.js";
import transform, { parser } from "#transforms/remove-global-ember/index.js";

const testCases = [
  {
    name: "should handle global Ember usage with no other ember imports in javascript",
    input: "no-ember-imports.input.js",
    output: "no-ember-imports.output.js",
  },
  {
    name: "should handle global Ember usage with no other ember imports in typescript",
    input: "no-ember-imports.input.ts",
    output: "no-ember-imports.output.ts",
  },
  {
    name: "should handle global Ember usage with other ember imports in javascript",
    input: "has-ember-imports.input.js",
    output: "has-ember-imports.output.js",
  },
  {
    name: "should handle global Ember usage with other ember imports in typescript",
    input: "has-ember-imports.input.ts",
    output: "has-ember-imports.output.ts",
  },
  {
    name: "should handle global Ember usage with no other imports in javascript",
    input: "no-imports.input.js",
    output: "no-imports.output.js",
  },
  {
    name: "should handle global Ember usage with no other imports in typescript",
    input: "no-imports.input.ts",
    output: "no-imports.output.ts",
  },
  {
    name: "should not do anything if Ember is imported properly in javascript",
    input: "no-change.input.js",
    output: "no-change.output.js",
  },
  {
    name: "should not do anything if Ember is imported properly in typescript",
    input: "no-change.input.js",
    output: "no-change.output.js",
  },
];

runTestCases("remove-global-ember", __dirname, testCases, transform, parser);
