#!/usr/bin/env node

import { detect, parseArguments, withContext } from "../api/index.ts";
import { rules } from "../rules/index.ts";

try {
  const config = parseArguments(process.argv.slice(2));
  const findings = await withContext(config, (context) => detect(rules, context));

  console.log(JSON.stringify(findings, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
