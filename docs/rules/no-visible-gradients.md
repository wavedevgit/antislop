# Visible gradients

![Visible gradients example](./assets/no-visible-gradients.png)

AI-generated websites often overuse clearly visible gradients; subtle lighting effects are allowed.

## How it works

Finds clearly visible CSS gradients while allowing subtle lighting effects.

## How to fix

Replace the gradient with a solid color or make the lighting effect subtle enough that it does not compete with content.

## Common false positives

Data scales, image masks, progress indicators, and established brand artwork may require a visible gradient.

## Scan support

| File scan | Browser scan |
| --- | --- |
| <span class="status-ok">Supported</span> | <span class="status-ok">Supported</span> |
