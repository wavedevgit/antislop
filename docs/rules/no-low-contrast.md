# Low contrast text

![Low contrast text example](./assets/no-low-contrast.png)

Text should meet WCAG AA contrast against the surface behind it.

## How it works

Computes rendered text contrast using WCAG thresholds: 4.5:1 for body text and 3:1 for large text.

## How to fix

Change the foreground or background until body text reaches 4.5:1 and large text reaches 3:1. Test every interactive state.

## Common false positives

Text over images, gradients, transparency, or unsupported blending may require manual contrast verification.

## Scan support

| File scan | Browser scan |
| --- | --- |
| <span class="status-no">Not supported</span> | <span class="status-ok">Supported</span> |
