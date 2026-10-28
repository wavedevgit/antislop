# Badge-like buttons

![Badge-like buttons example](./assets/no-pill-buttons.png)

Short, fully rounded buttons can look like badges instead of interactive controls.

## How it works

Finds fully rounded text controls under 36px tall. Circular icon buttons are allowed.

## How to fix

Increase the control height or reduce the radius so the element reads as a button rather than a badge.

## Common false positives

Chips, filters, tags, segmented options, and compact toolbar controls may intentionally use a pill shape.

## Scan support

| File scan | Browser scan |
| --- | --- |
| <span class="status-no">Not supported</span> | <span class="status-ok">Supported</span> |
