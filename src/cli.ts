#!/usr/bin/env node

import { resolve, join } from "path";
import { run } from "jscodeshift/src/Runner";

const transformerPath = resolve(__dirname, join("transforms", process.argv[2]));
const filePaths = process.argv.slice(3);

run(transformerPath, filePaths, {});
