import { execFile } from "node:child_process";
import { constants } from "node:fs";
import { access, mkdir, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { delimiter, join } from "node:path";

const names = new Set([
  "brave",
  "brave-browser",
  "brave-browser-stable",
  "chrome",
  "chrome-headless-shell",
  "chromium",
  "chromium-browser",
  "google-chrome",
  "google-chrome-stable",
  "helium",
  "microsoft-edge",
  "microsoft-edge-stable",
  "msedge",
  "opera",
  "vivaldi",
  "vivaldi-stable",
]);

const ignoredDirectories = new Set([".cache", ".git", ".npm", ".rustup", "node_modules", "Trash"]);

const cachePath = join(homedir(), ".cache/antislop-browser.txt");

function isBrowser(name: string): boolean {
  const lower = name.toLowerCase();
  const executable = lower.endsWith(".exe") ? lower.slice(0, -4) : lower;

  return names.has(executable)
    || (/\.appimage$/i.test(lower) && /(?:brave|chrome|chromium|edge|helium|opera|vivaldi)/i.test(lower));
}

async function workingBrowser(path: string): Promise<string | undefined> {
  try {
    await access(path, process.platform === "win32" ? constants.F_OK : constants.X_OK);

    const resolved = await realpath(path);

    const works = await new Promise<boolean>((resolve) => {
      execFile(resolved, ["--version"], { timeout: 5_000, windowsHide: true }, (error) => resolve(error === null));
    });

    return works ? resolved : undefined;
  } catch {
    return undefined;
  }
}

async function searchDirectory(root: string, maximumDepth: number): Promise<string | undefined> {
  const queue = [{ path: root, depth: 0 }];

  for (let index = 0; index < queue.length; index += 1) {
    const directory = queue[index];

    if (!directory) continue;

    let entries;

    try {
      entries = await readdir(directory.path, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const path = join(directory.path, entry.name);

      if (entry.isDirectory()) {
        if (directory.depth < maximumDepth && !ignoredDirectories.has(entry.name)) queue.push({ path, depth: directory.depth + 1 });
      } else if ((entry.isFile() || entry.isSymbolicLink()) && isBrowser(entry.name)) {
        const browser = await workingBrowser(path);

        if (browser) return browser;
      }
    }
  }

  return undefined;
}

async function findWindowsBrowser(): Promise<string | undefined> {
  const locations = [
    [process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"],
    [process.env.LOCALAPPDATA, "Chromium/Application/chrome.exe"],
    [process.env.LOCALAPPDATA, "BraveSoftware/Brave-Browser/Application/brave.exe"],
    [process.env.LOCALAPPDATA, "Microsoft/Edge/Application/msedge.exe"],
    [process.env.LOCALAPPDATA, "Vivaldi/Application/vivaldi.exe"],
    [process.env.LOCALAPPDATA, "Programs/Opera/opera.exe"],
    [process.env.PROGRAMFILES, "Google/Chrome/Application/chrome.exe"],
    [process.env.PROGRAMFILES, "BraveSoftware/Brave-Browser/Application/brave.exe"],
    [process.env.PROGRAMFILES, "Microsoft/Edge/Application/msedge.exe"],
    [process.env.PROGRAMFILES, "Vivaldi/Application/vivaldi.exe"],
    [process.env["PROGRAMFILES(X86)"], "Google/Chrome/Application/chrome.exe"],
    [process.env["PROGRAMFILES(X86)"], "Microsoft/Edge/Application/msedge.exe"],
  ] as const;

  for (const [root, path] of locations) {
    if (!root) continue;

    const browser = await workingBrowser(join(root, ...path.split("/")));

    if (browser) return browser;
  }

  return undefined;
}

async function findFlatpakBrowser(): Promise<string | undefined> {
  for (const root of [join(homedir(), ".local/share/flatpak/app"), "/var/lib/flatpak/app"]) {
    const browser = await searchDirectory(root, 8);

    if (browser) return browser;
  }

  return undefined;
}

async function findMacBrowser(): Promise<string | undefined> {
  const applications = ["/Applications", join(homedir(), "Applications")];

  const executables = [
    "Arc.app/Contents/MacOS/Arc",
    "Brave Browser.app/Contents/MacOS/Brave Browser",
    "Chromium.app/Contents/MacOS/Chromium",
    "Google Chrome.app/Contents/MacOS/Google Chrome",
    "Helium.app/Contents/MacOS/Helium",
    "Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "Opera.app/Contents/MacOS/Opera",
    "Vivaldi.app/Contents/MacOS/Vivaldi",
  ];

  for (const root of applications) {
    for (const path of executables) {
      const browser = await workingBrowser(join(root, ...path.split("/")));

      if (browser) return browser;
    }
  }

  return undefined;
}

async function discoverBrowser(): Promise<string | undefined> {
  for (const path of [process.env.CHROME_PATH, process.env.PUPPETEER_EXECUTABLE_PATH]) {
    if (!path) continue;

    const browser = await workingBrowser(path);

    if (browser) return browser;
  }

  const executableNames = process.platform === "win32" ? [...names].map((name) => `${name}.exe`) : names;

  for (const directory of (process.env.PATH ?? "").split(delimiter).filter(Boolean)) {
    for (const name of executableNames) {
      const browser = await workingBrowser(join(directory, name));

      if (browser) return browser;
    }
  }

  if (process.platform === "win32") {
    const browser = await findWindowsBrowser();

    if (browser) return browser;
  } else if (process.platform === "darwin") {
    const browser = await findMacBrowser();

    if (browser) return browser;
  } else {
    const browser = await findFlatpakBrowser();

    if (browser) return browser;
  }

  for (const directory of ["Applications", "Downloads", "helium"]) {
    const browser = await searchDirectory(join(homedir(), directory), 4);

    if (browser) return browser;
  }

  return searchDirectory(homedir(), 6);
}

export async function findBrowser(): Promise<string | undefined> {
  try {
    const cached = (await readFile(cachePath, "utf8")).trim();
    const browser = cached ? await workingBrowser(cached) : undefined;

    if (browser) return browser;

    await rm(cachePath, { force: true });
  } catch {}

  const browser = await discoverBrowser();

  if (browser) {
    await mkdir(join(homedir(), ".cache"), { recursive: true });
    await writeFile(cachePath, `${browser}\n`);
  }

  return browser;
}
