#!/usr/bin/env node

import { detect, parseArguments, screenshotVisualFindings, showVisualFindings, withContext } from "../api/index.ts";
import { rules } from "../rules/index.ts";

try {
  const config = parseArguments(process.argv.slice(2));
  const disabled = new Set(config.disabledRuleIds);
  const unknown = config.disabledRuleIds.filter((id) => !rules.some((rule) => rule.id === id));

  if (unknown.length > 0) {
    throw new Error(`Unknown rule ID${unknown.length === 1 ? "" : "s"}: ${unknown.join(", ")}`);
  }

  const findings = await withContext(config, async (context) => {
    const findings = await detect(rules.filter((rule) => !disabled.has(rule.id)), context);

    if (config.type === "browser" && context.type === "puppeteer") {
      if (config.screenshot) {
        await screenshotVisualFindings(context.page, findings, config.screenshot);
      } else if (config.visual) {
        await showVisualFindings(context.page, findings);
      }
    }

    return findings;
  });

  console.log(JSON.stringify(findings, null, 2));

  if (config.type === "browser" && config.screenshot) console.error(`Screenshot saved to ${config.screenshot}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
