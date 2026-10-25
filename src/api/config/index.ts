export type DetectorConfig =
  | { type: "browser"; executablePath: string; url: string; visual: boolean; screenshot?: string; screenshotProblems?: string; disabledRuleIds: readonly string[] }
  | { type: "files"; folder: string; disabledRuleIds: readonly string[] };

export function parseArguments(args: readonly string[]): DetectorConfig {
  const options = new Map<string, string>();
  let visual = false;
  let screenshot: string | undefined;
  let screenshotProblems: string | undefined;

  for (let index = 0; index < args.length;) {
    const name = args[index];

    if (name === "--visual") {
      visual = true;
      index += 1;
      continue;
    }

    if (name === "--screenshot") {
      const path = args[index + 1];

      screenshot = path && !path.startsWith("--") ? path : "antislop-screenshot.png";
      index += path && !path.startsWith("--") ? 2 : 1;
      continue;
    }

    if (name === "--screenshot-problems") {
      const path = args[index + 1];

      screenshotProblems = path && !path.startsWith("--") ? path : "antislop-problems.png";
      index += path && !path.startsWith("--") ? 2 : 1;
      continue;
    }

    const value = args[index + 1];

    if (!name?.startsWith("--") || !value || value.startsWith("--")) {
      throw new Error(`Expected a value after ${name ?? "an option"}`);
    }

    if (!["--browser", "--url", "--folder", "--disable"].includes(name)) {
      throw new Error(`Unknown option: ${name}`);
    }

    options.set(name, value);
    index += 2;
  }

  const browser = options.get("--browser");
  const url = options.get("--url");
  const folder = options.get("--folder");
  const disabledRuleIds = options.get("--disable")?.split(",").map((id) => id.trim()).filter(Boolean) ?? [];

  if ([visual, Boolean(screenshot), Boolean(screenshotProblems)].filter(Boolean).length > 1) {
    throw new Error("Use only one of --visual, --screenshot, or --screenshot-problems");
  }

  if (folder && !browser && !url && !visual && !screenshot && !screenshotProblems) {
    return { type: "files", folder, disabledRuleIds };
  }

  if (browser && url && !folder) {
    return { type: "browser", executablePath: browser, url: /^https?:\/\//i.test(url) ? url : `https://${url}`, visual, screenshot, screenshotProblems, disabledRuleIds };
  }

  throw new Error("Use either --folder <path> or --browser <chromium-path> --url <url> [--visual | --screenshot [path] | --screenshot-problems [path]]");
}
