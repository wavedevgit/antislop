# AntiSlop

AntiSlop scans website source files or a rendered page for common AI-generated design habits. Findings are printed as JSON so the detector can be used from scripts, agents, or CI.

## Setup

Requires a recent version of Node.js with TypeScript type stripping.

```sh
npm install
```

## Usage

Scan a folder of source files:

```sh
node src/cli/index.ts --folder ./path/to/site
```

Disable rules by ID with a comma-separated list:

```sh
node src/cli/index.ts \
  --folder ./path/to/site \
  --disable gradients,neon-border
```

Unknown rule IDs cause an error instead of being silently ignored.

Scan a rendered page with an installed Chromium browser:

```sh
node src/cli/index.ts \
  --browser /usr/bin/chromium \
  --url https://example.com
```

The two modes are complementary:

- **Folder scanning** inspects HTML, CSS, and utility classes, including supported Tailwind utilities.
- **Browser scanning** inspects visible elements and their computed styles.

Example output:

```json
[
  {
    "rule": {
      "id": "text-arrow",
      "title": "Text arrow",
      "description": "Only AI uses this arrow. Use an icon instead."
    },
    "explanation": "2 text arrows were found. Use icons instead.",
    "references": [
      {
        "type": "element",
        "selector": "#primary-cta",
        "source": "Get started →"
      }
    ]
  }
]
```

References identify the matching file position during source scans or the exact matching element during browser scans. Browser references use an element ID when available and otherwise provide a unique XPath selector.

## Rules

- Eyebrows over every title
- Unicode bullets
- Visible gradients
- Pill badges above the main headline
- Dotted or grid backgrounds
- Cream-colored backgrounds
- Rounded cards with accent stripes
- Cards inside cards
- Contrasting SVG logo cards
- Text arrows (`→`)
- Decorative monospace fonts
- Overused fonts such as Playfair Display and Instrument Serif
- Mostly italic titles
- Neon borders
- Buzzwords such as “made with love,” “seamless,” “blazing,” “next-generation,” and “game-changing”
- Soft corners everywhere
- Too many em dashes
- Too many emojis
- Everything in one HTML file
- Desktop navigation bars taller than 64px
- Oversized CTA headings
- Divided list rows
- Excessive letter spacing
- Excessive padding

## Development

```sh
npm run lint
npm run typecheck
```

Rules live in `src/rules/` and are registered in `src/rules/index.ts`.

## License

ISC
