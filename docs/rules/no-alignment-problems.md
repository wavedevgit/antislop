# Alignment problems

![Alignment problems example](./assets/no-alignment-problems.png)

Equivalent content in a repeated row of cards should align consistently.

## How it works

Compares corresponding child positions across three or more similarly sized cards in the same rendered row.

## How to fix

Give repeated cards a consistent internal layout. Align equivalent headings, body copy, and actions with shared grid rows or flex rules.

## Common false positives

Cards with intentionally different content structures may not need matching child positions.

## Scan support

| File scan | Browser scan |
| --- | --- |
| <span class="status-no">Not supported</span> | <span class="status-ok">Supported</span> |
