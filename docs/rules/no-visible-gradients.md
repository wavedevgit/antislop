# AI-style gradients

![AI-style gradient text and button](./assets/no-visible-gradients.png)

AI-generated websites often reuse vivid multi-hue gradients such as pink to purple, blue to cyan, or orange to magenta on text, buttons, and decorative surfaces.

## How it works

Finds linear gradients with at least two vivid, mostly opaque color stops separated by a clear hue shift. This includes the familiar pink-to-purple, blue-to-cyan, and blue-to-orange treatments used on display text, buttons, and decorative surfaces.

### Reported

- Saturated multi-hue linear gradients
- Gradients clipped into text
- Vivid gradient fills on buttons and decorative surfaces

### Not reported

- Same-hue shading such as dark blue to light blue
- Neutral fades and image-readability overlays
- Low-opacity lighting effects
- Radial aurora backgrounds, which are covered by `no-aurora-backgrounds`

## How to fix

Use a solid brand color. If a gradient communicates depth or state, keep it restrained and within one hue.

## Common false positives

Data scales, progress indicators, color pickers, and established brand artwork may require a vivid multi-hue gradient.

## Scan support

| File scan | Browser scan |
| --- | --- |
| <span class="status-ok">Supported</span> | <span class="status-ok">Supported</span> |
