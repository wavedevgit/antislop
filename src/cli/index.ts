#!/usr/bin/env node

import { parseArguments } from "../config/index.ts";
import { withContext } from "../context/index.ts";
import { detect } from "../detector/index.ts";
import type { Rule } from "../rules/index.ts";

const rules: Rule[] = [];

try {
  const config = parseArguments(process.argv.slice(2));
  const findings = await withContext(config, (context) => detect(rules, context));

  console.log(JSON.stringify(findings, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
