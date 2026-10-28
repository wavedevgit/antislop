# Inconsistent button radius

![Inconsistent button radius example](./assets/no-inconsistent-button-radius.png)

Buttons in the same interface should not switch arbitrarily between square and rounded corners.

## How it works

Collects button corner radii and reports interfaces that mix conflicting radius values.

## How to fix

Use a shared radius token for related buttons. Keep shape differences only when they communicate a distinct control type.

## Common false positives

Circular icon buttons and segmented controls may intentionally differ from text buttons.

## Scan support

| File scan | Browser scan |
| --- | --- |
| <span class="status-ok">Supported</span> | <span class="status-ok">Supported</span> |
