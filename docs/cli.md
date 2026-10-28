# CLI reference

AntiSlop prints findings as formatted JSON to standard output. Failed browser discovery and invalid commands return a non-zero exit status. A completed scan returns zero whether or not it finds problems, so inspect the JSON output rather than using the exit status as a quality gate.

## Scan modes

Choose exactly one scan mode.

```sh
# Scan source files
npx --yes --package=github:wavedevgit/antislop antislop \
  --folder ./path/to/site

# Scan a rendered page
npx --yes --package=github:wavedevgit/antislop antislop \
  --browser /path/to/chromium \
  --url https://example.com
```

| Option | Value | Description |
| --- | --- | --- |
| `--folder` | Directory | Scan HTML, CSS, and supported Tailwind utilities. |
| `--browser` | Executable path | Launch a Chromium-compatible browser. Requires `--url`. |
| `--url` | URL | Page to scan. URLs without a protocol use `https://`. Requires `--browser`. |
| `--disable` | Comma-separated rule IDs | Skip selected rules. Unknown IDs are errors. |

## Color tools

These commands run without a browser. They accept concrete CSS colors such as hex, named colors, `rgb()`, `hsl()`, and `oklch()`. Quote colors that contain spaces or shell punctuation.

```sh
# Measure a foreground/background pair against WCAG 2 thresholds
npx --yes --package=github:wavedevgit/antislop antislop \
  contrast "oklch(45% 0.15 250)" white

# Generate semantic roles from one accent and an optional background
npx --yes --package=github:wavedevgit/antislop antislop \
  colors rebeccapurple
npx --yes --package=github:wavedevgit/antislop antislop \
  colors "rgb(50 100 220)" "#111827"
```

`contrast` reports the measured ratio and pass/fail results for normal text, large text, and UI components. `colors` returns the normalized accent, accessible text, on-accent text, hover, active, subtle, and border colors. Its background defaults to white.

Both commands reject transparent colors because contrast depends on the surface beneath them.

## Browser output

These options only work with `--browser` and `--url`. Use at most one per scan.

| Option | Default file | Description |
| --- | --- | --- |
| `--visual` | — | Open the page with highlighted findings and wait until the tab closes. |
| `--screenshot [path]` | `antislop-screenshot.png` | Save a full-page screenshot with highlighted findings. |
| `--screenshot-problems [path]` | `antislop-problems.png` | Save a report containing explanations and affected-element screenshots. |

## Browser discovery

```sh
npx --yes --package=github:wavedevgit/antislop antislop --find-browser
```

The command prints the first verified browser path. It checks `CHROME_PATH`, `PUPPETEER_EXECUTABLE_PATH`, `PATH`, platform install locations, and common locations under the home directory. The verified path is cached in `~/.cache/antislop-browser.txt` and checked again before reuse. `--find-browsers` is accepted as an alias.

## Output and errors

- Findings are written to standard output as a JSON array.
- Screenshot completion messages are written to standard error.
- Invalid combinations, missing values, unknown options, unknown rule IDs, and browser failures return exit status `1`.
- Successful scans return exit status `0`, including scans that report findings.
