export type DetectorConfig =
  | { type: "browser"; executablePath: string; url: string; visual: boolean; screenshot?: string; disabledRuleIds: readonly string[] }
  | { type: "files"; folder: string; disabledRuleIds: readonly string[] };

export function parseArguments(args: readonly string[]): DetectorConfig {
  const options = new Map<string, string>();
  let visual = false;
  let screenshot: string | undefined;

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

  if (visual && screenshot) {
    throw new Error("Use either --visual or --screenshot, not both");
  }

  if (folder && !browser && !url && !visual) {
    return { type: "files", folder, disabledRuleIds };
  }

  if (browser && url && !folder) {
    return { type: "browser", executablePath: browser, url: /^https?:\/\//i.test(url) ? url : `https://${url}`, visual, screenshot, disabledRuleIds };
  }

  throw new Error("Use either --folder <path> or --browser <chromium-path> --url <url> [--visual | --screenshot [path]]");
}
