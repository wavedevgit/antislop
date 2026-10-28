# AI color palette

![AI color palette example](./assets/no-ai-color-palette.png)

Avoid color palettes that have become recognizable defaults in AI-generated interfaces. The current list contains cream colors, `#4F46E5` indigo, and `#00FF00` neon green.

## How it works

Checks background colors against the known AI palette list in the rule. Cream is matched by hue, saturation, lightness, CSS names, and Tailwind utilities; `#4F46E5` and `#00FF00` are matched exactly. CSS `lime` is also recognized.

## How to fix

Choose colors from the product brand or content instead of using the flagged defaults unchanged. Verify contrast after replacing them.

## Common false positives

A flagged color may be part of an established brand palette or a semantic status color.

## Scan support

| File scan | Browser scan |
| --- | --- |
| <span class="status-ok">Supported</span> | <span class="status-ok">Supported</span> |
