import puppeteer from "puppeteer-core";

import type { DetectorConfig } from "../config/index.ts";
import { readFiles, type RuleContext } from "../rules/index.ts";

export async function withContext<T>(
  config: DetectorConfig,
  run: (context: RuleContext) => T | Promise<T>,
): Promise<T> {
  if (config.type === "files") {
    return run({ type: "files", files: await readFiles(config.folder) });
  }

  const browser = await puppeteer.launch({
    executablePath: config.executablePath,
    headless: !config.visual,
    defaultViewport: config.visual ? null : config.screenshot || config.screenshotProblems ? { width: 1920, height: 1080 } : undefined,
    args: config.visual ? ["--start-maximized"] : undefined,
  });

  try {
    const page = await browser.newPage();

    if (config.visual || config.screenshot || config.screenshotProblems) await page.setBypassCSP(true);

    await page.goto(config.url, { waitUntil: "networkidle2" });

    return await run({ type: "puppeteer", page });
  } finally {
    if (browser.connected) await browser.close();
  }
}
