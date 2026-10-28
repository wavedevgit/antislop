# Card border on hover

![Card border on hover example](./assets/no-hover-card-borders.png)

Adding a border only on hover makes cards shift or flash an unnecessary outline.

## How it works

Finds rounded, filled cards targeted by hover styles that add a visible border.

## How to fix

Reserve border space in the default state or use a non-layout-changing background, shadow, or transform for hover feedback.

## Common false positives

A border-color change on an existing transparent border does not cause layout shift and may be intentional.

## Scan support

| File scan | Browser scan |
| --- | --- |
| <span class="status-ok">Supported</span> | <span class="status-ok">Supported</span> |
