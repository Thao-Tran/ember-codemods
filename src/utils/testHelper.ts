import { describe, test } from "node:test";
import assert from "node:assert";
import path from "node:path";
import fs from "fs";
import jscodeshift from "jscodeshift";
import type { API, FileInfo, Options } from "jscodeshift";

interface TestCase {
  name: string;
  input: string;
  output: string;
}

interface TransformFunction {
  (fileInfo: FileInfo, api: API, options: Options): string;
}

function runTestCases(
  name: string,
  dir: string,
  testCases: TestCase[],
  transform: TransformFunction,
  parser: string,
) {
  describe(name, () => {
    const fixtureDir = path.join(dir, "fixtures");

    testCases.forEach((testCase) => {
      test(testCase.name, () => {
        const inputPath = path.join(fixtureDir, testCase.input);
        const outputPath = path.join(fixtureDir, testCase.output);
        const source = fs.readFileSync(inputPath, "utf8");
        const expectedOutput = fs.readFileSync(outputPath, "utf-8");

        const j = jscodeshift.withParser(parser);

        const actualOutput = transform(
          { path: inputPath, source },
          { j, jscodeshift: j, stats: () => {}, report: () => {} },
          {},
        );

        assert.equal(actualOutput.trim(), expectedOutput.trim());
      });
    });
  });
}

export default runTestCases;
