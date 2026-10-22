#!/usr/bin/env node

import { detect, parseArguments, withContext } from "../api/index.ts";
import { rules } from "../rules/index.ts";

try {
  const config = parseArguments(process.argv.slice(2));
  const disabled = new Set(config.disabledRuleIds);
  const unknown = config.disabledRuleIds.filter((id) => !rules.some((rule) => rule.id === id));

  if (unknown.length > 0) {
    throw new Error(`Unknown rule ID${unknown.length === 1 ? "" : "s"}: ${unknown.join(", ")}`);
  }

  const findings = await withContext(config, (context) => detect(rules.filter((rule) => !disabled.has(rule.id)), context));

  console.log(JSON.stringify(findings, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
