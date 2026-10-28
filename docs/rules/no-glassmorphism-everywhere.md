# Glassmorphism everywhere

![Glassmorphism everywhere example](./assets/no-glassmorphism-everywhere.png)

Blur effects, glass cards, and glow borders are often used as decoration rather than to solve a real layering problem.

## How it works

Counts translucent blurred surfaces and reports repeated decorative glass effects.

## How to fix

Remove repeated blur and translucency. Keep glass only where it communicates a surface floating over visible content.

## Common false positives

Media controls and temporary overlays may legitimately need translucent backdrop blur.

## Scan support

| File scan | Browser scan |
| --- | --- |
| <span class="status-ok">Supported</span> | <span class="status-ok">Supported</span> |
