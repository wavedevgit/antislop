#!/usr/bin/env node

import { checkContrast, createColorRoles, detect, findBrowser, parseArguments, screenshotProblemReport, screenshotVisualFindings, showVisualFindings, withContext } from "../api/index.ts";
import { rules } from "../rules/index.ts";

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args[0] === "contrast") {
    if (args.length !== 3) throw new Error("Usage: antislop contrast <foreground> <background>");

    console.log(JSON.stringify(checkContrast(args[1]!, args[2]!), null, 2));

    return;
  }

  if (args[0] === "colors") {
    if (args.length < 2 || args.length > 3) throw new Error("Usage: antislop colors <accent> [background]");

    console.log(JSON.stringify(createColorRoles(args[1]!, args[2]), null, 2));

    return;
  }

  if (args.length === 1 && (args[0] === "--find-browser" || args[0] === "--find-browsers")) {
    const browser = await findBrowser();

    if (!browser) throw new Error("No working Chromium-compatible browser was found");

    console.log(browser);

    return;
  }

  const config = parseArguments(args);
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
      } else if (config.screenshotProblems) {
        await screenshotProblemReport(context.page, findings, config.screenshotProblems);
      } else if (config.visual) {
        await showVisualFindings(context.page, findings);
      }
    }

    return findings;
  });

  console.log(JSON.stringify(findings, null, 2));

  if (config.type === "browser" && config.screenshot) console.error(`Screenshot saved to ${config.screenshot}`);

  if (config.type === "browser" && config.screenshotProblems) console.error(`Problem report saved to ${config.screenshotProblems}`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
