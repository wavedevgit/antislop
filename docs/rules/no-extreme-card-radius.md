# Extreme border-radius on cards

![Extreme border-radius on cards example](./assets/no-extreme-card-radius.png)

Large corner radii can squeeze card content and make every card look alike.

## How it works

Finds card-like containers with corner radii that are unusually large for their size.

## How to fix

Reduce the radius to fit the card size and preserve usable content space. Use one restrained radius scale across related surfaces.

## Common false positives

Circular media, chips, and intentionally capsule-shaped controls are not ordinary cards.

## Scan support

| File scan | Browser scan |
| --- | --- |
| <span class="status-ok">Supported</span> | <span class="status-ok">Supported</span> |
