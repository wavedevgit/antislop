# AI-style gradients

![Visible gradients example](./assets/no-visible-gradients.png)

AI-generated websites often reuse vivid multi-hue gradients such as pink to purple, blue to cyan, or orange to magenta on text, buttons, and decorative surfaces.

## How it works

Finds saturated linear gradients that move between distinct hues. Subtle same-hue shading, transparency masks, and radial aurora backgrounds are not reported by this rule. Aurora backgrounds are covered by `no-aurora-backgrounds`.

## How to fix

Use a solid brand color, or keep the gradient within one hue when it communicates depth or state.

## Common false positives

Data scales, progress indicators, color pickers, and established brand artwork may require a vivid multi-hue gradient.

## Scan support

| File scan | Browser scan |
| --- | --- |
| <span class="status-ok">Supported</span> | <span class="status-ok">Supported</span> |
