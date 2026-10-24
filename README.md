# AntiSlop

Detects common AI-generated website habits in source files or rendered pages. Results are JSON with exact file or element references.

## Install

Requires a recent Node.js version with TypeScript type stripping.

```sh
npm install
```

## Usage

```sh
# Scan HTML, CSS, and supported Tailwind utilities
node src/cli/index.ts --folder ./path/to/site

# Scan computed styles in Chromium
node src/cli/index.ts --browser /usr/bin/chromium --url https://example.com

# Disable rules by ID
node src/cli/index.ts --folder ./path/to/site \
  --disable no-visible-gradients,no-neon-borders
```

Unknown rule IDs fail instead of being ignored.

## Rules

- **Copy:** `no-unicode-bullets`, `no-text-arrows`, `no-buzzwords`, `limit-em-dashes`, `limit-emojis`
- **Typography:** `no-eyebrows-over-all-titles`, `no-decorative-monospace`, `no-overused-fonts`, `no-mostly-italic-titles`, `no-excessive-letter-spacing`, `no-oversized-cta-headings`
- **Visual:** `no-visible-gradients`, `no-patterned-backgrounds`, `no-cream-colors`, `no-accent-stripe-cards`, `no-nested-cards`, `no-fake-logo-cards`, `no-neon-borders`, `no-soft-corners-everywhere`
- **Layout:** `no-headline-badges`, `no-divided-list-rows`, `no-oversized-navbar`, `no-excessive-padding`
- **Structure:** `no-monolithic-html`, `require-meta-tags`

Rules live in `src/rules/` and are registered in `src/rules/index.ts`.

## Development

```sh
npm run lint
npm run typecheck
```

## License

GPL-3.0-only
