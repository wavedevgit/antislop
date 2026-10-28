---
name: antislop-design
description: MUST be used before creating, redesigning, or modifying any website, landing page, web app, frontend component, HTML/CSS, or browser-rendered interface. Establishes the palette, typography, themes, and icon library before implementation, prevents common AI-design patterns, and requires an AntiSlop scan before completion.
license: GPL-3.0-only
compatibility: Requires Node.js 22.12 or newer and network access to run the AntiSlop scanner from GitHub. Browser scans require a Chromium-compatible executable.
---

# AntiSlop Design

## Check for updates

Once per session, check only this globally installed skill:

```sh
npx skills check --global antislop-design
```

If an update is available, tell the user and ask whether they want it installed, then continue the current work without waiting for an answer. Never update automatically. If the user accepts, run:

```sh
npx skills update --global antislop-design -y
```

If the check fails or no update is available, continue silently.

## Ask first

Before editing, ask the user these four questions together unless the answers are already explicit:

1. What color palette or brand colors should the interface use?
2. What font family or type direction should it use?
3. Which themes should it support: light, dark, both, or system-controlled?
4. Which icon library should it use: Hugeicons, Font Awesome, or Google Icons?

Do not choose these silently. If the user wants recommendations, propose concise options and wait for their choice.

## Design rules

Use this checklist while designing so the scanner is a final check, not the design process.

### Copy

- Use semantic lists instead of decorative Unicode bullets.
- Use icons instead of text arrows such as `→`.
- Avoid canned phrases such as “made with love,” “seamless,” “blazing-fast,” “next-generation,” and “game-changing.”
- Avoid emoji and use icons instead. Use emoji only when they are necessary to the meaning or explicitly requested.

### Typography

- Do not place an eyebrow or kicker above every heading.
- Keep the hero heading to three rendered lines or fewer.
- Use monospace only for code, data, or measurements.
- Avoid Playfair Display, Instrument Serif, Archivo, Space Grotesk, and DM Sans unless the user explicitly chose one.
- Do not italicize most headings.
- Avoid conspicuously wide letter spacing.
- Keep CTA headings proportional to the surrounding section.

### Color and effects

- Avoid visible decorative gradients, aurora blobs, dotted grids, glass effects, neon glows, and patterned backgrounds.
- Avoid the known AI palette defaults: cream backgrounds, `#4F46E5`, and `#00FF00`/CSS `lime`, unless explicitly requested.
- Do not use thick colored card borders, accent stripes, or borders that appear only on hover.
- Do not combine a hairline card border with a wide soft shadow.
- Do not add decorative live or online signals. Keep status indicators only when they report real state.
- Give each surface one clear depth treatment.

### Cards and shapes

- Do not nest filled rounded cards inside cards.
- Do not put a generic SVG inside a contrasting logo tile.
- Avoid extreme card radii and applying the same soft radius to every surface.
- Reserve pill shapes for genuinely compact or circular controls.
- Keep button heights and corner radii consistent within an interface.

### Layout and controls

- Align equivalent content across repeated cards.
- Do not put decorative badges above the main headline or short lines before labels.
- Keep at least 24px between desktop navigation and following content, and visible space below headings.
- Avoid oversized desktop navbars and excessive padding.
- Prefer semantic links for navigation; buttons need a visible base or hover treatment.
- Avoid repeated multi-column list rows separated only by horizontal rules.
- Do not add a navbar theme toggle unless the user requested one.
- Use the icon library selected by the user. Do not mix icon libraries or substitute Unicode symbols for icons.

### Quality and structure

- Aim to meet WCAG AA text contrast: 4.5:1 for body text and 3:1 for large text. Do not calculate contrast manually; use the AntiSlop detector to verify it.
- Prevent text from overflowing its container.
- Include title, description, and viewport metadata.
- Keep HTML, CSS, and JavaScript separated when the project warrants multiple files.

The detector is authoritative when this summary and the current rule implementation differ. Current rule details are available at <https://github.com/wavedevgit/antislop/tree/main/docs/rules>.

## Required color checks

Before implementing a chosen palette, measure every solid text and background pair instead of estimating contrast:

```sh
npx --yes --package=github:wavedevgit/antislop antislop contrast <foreground> <background>
```

Use the color-role generator when deriving text, hover, active, subtle, or border colors from one accent:

```sh
npx --yes --package=github:wavedevgit/antislop antislop colors <accent> [background]
```

Use the generated values as a starting point, map them to semantic tokens, and keep established brand colors unchanged unless the user approves a change. These commands check declared solid colors without a browser; the final browser scan still verifies rendered colors, transparency, and layout.

## Required scan

Always scan the completed website before declaring the task finished.

1. Use the user's existing dev server or deployed URL. If neither exists, start the project's existing `dev`, `start`, or preview command; do not add a server dependency solely for scanning.
2. Prefer a browser scan whenever a Chromium-compatible executable is available. Before scanning, read `~/.cache/antislop-browser.txt`. If it contains a path, run that binary with `--version`; use it when valid. If it is missing or invalid, run the browser finder below. The finder searches again and saves the working path to that cache file.
3. Fall back to a file scan only when no browser executable or runnable URL is available, and state that it is less accurate.

Browser finder:

```sh
npx --yes --package=github:wavedevgit/antislop antislop --find-browser
```

Browser scan:

```sh
npx --yes --package=github:wavedevgit/antislop antislop --browser <chromium-path> --url <local-or-deployed-url>
```

File scan:

```sh
npx --yes --package=github:wavedevgit/antislop antislop --folder <website-root>
```

Read the JSON findings, fix every finding at its source, and scan again. Continue until the scan is clean. Do not hide findings with `--disable`; only leave a finding when the user explicitly approves that exact exception, and report it in the final response.
