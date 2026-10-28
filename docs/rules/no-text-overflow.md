# Text overflow

![Text overflow example](./assets/no-text-overflow.png)

Text should fit inside its container instead of spilling past the edge.

## How it works

Finds visible text that extends at least 16px beyond its container, while ignoring scrollable and intentionally truncated text.

## How to fix

Allow wrapping, constrain the content, or add intentional truncation with access to the full value. Test long and localized strings.

## Common false positives

Carousels, marquees, code panes, and intentionally scrollable regions may extend content beyond a viewport.

## Scan support

| File scan | Browser scan |
| --- | --- |
| <span class="status-no">Not supported</span> | <span class="status-ok">Supported</span> |
