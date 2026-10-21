export type DetectorConfig =
  | { type: "browser"; executablePath: string; url: string }
  | { type: "files"; folder: string };

export function parseArguments(args: readonly string[]): DetectorConfig {
  const options = new Map<string, string>();

  for (let index = 0; index < args.length; index += 2) {
    const name = args[index];
    const value = args[index + 1];

    if (!name?.startsWith("--") || !value || value.startsWith("--")) {
      throw new Error(`Expected a value after ${name ?? "an option"}`);
    }

    if (!["--browser", "--url", "--folder"].includes(name)) {
      throw new Error(`Unknown option: ${name}`);
    }

    options.set(name, value);
  }

  const browser = options.get("--browser");
  const url = options.get("--url");
  const folder = options.get("--folder");

  if (folder && !browser && !url) {
    return { type: "files", folder };
  }

  if (browser && url && !folder) {
    return { type: "browser", executablePath: browser, url: /^https?:\/\//i.test(url) ? url : `https://${url}` };
  }

  throw new Error("Use either --folder <path> or --browser <chromium-path> --url <url>");
}
