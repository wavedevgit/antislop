# Inconsistent button heights

![Inconsistent button heights example](./assets/no-inconsistent-button-heights.png)

Buttons in the same action row should have equal heights.

## How it works

Compares sibling buttons in one action row and reports height differences of at least 2px.

## How to fix

Apply one shared height or vertical-padding token to buttons in the same action group.

## Common false positives

Icon-only controls or intentionally compact secondary actions may use a different size when they are not peers.

## Scan support

| File scan | Browser scan |
| --- | --- |
| <span class="status-ok">Supported</span> | <span class="status-ok">Supported</span> |
