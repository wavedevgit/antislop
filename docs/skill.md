# Agent skill

The `antislop-design` skill guides coding agents before and during frontend work. It gathers the palette, typography, theme, and icon requirements before implementation, includes AntiSlop's design rules, and requires a final browser scan.

## Install

```sh
npx skills add wavedevgit/antislop --skill antislop-design
```

The skill requires Node.js 22.12 or newer and network access to run the scanner from GitHub. Browser scans also require a Chromium-compatible executable.

## What it enforces

- Ask for visual requirements before changing an interface.
- Apply the current AntiSlop design checklist while implementing.
- Check solid text and background color contrast.
- Scan the finished interface and fix every reported finding.
- Check for skill updates once per session without updating automatically.

Read the [complete skill source](https://github.com/wavedevgit/antislop/blob/main/skills/SKILL.md) for the agent instructions.
