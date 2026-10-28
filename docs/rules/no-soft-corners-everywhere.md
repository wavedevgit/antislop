# Soft corners everywhere

![Soft corners everywhere example](./assets/no-soft-corners-everywhere.png)

AI-generated websites often apply the same soft corner radius to nearly every interface surface.

## How it works

Counts repeated moderate corner radii across many interface surfaces.

## How to fix

Remove radii from surfaces that do not need containment and define a small radius scale for the components that do.

## Common false positives

A mature design system may intentionally use one recurring radius as a strong brand characteristic.

## Scan support

| File scan | Browser scan |
| --- | --- |
| <span class="status-ok">Supported</span> | <span class="status-ok">Supported</span> |
