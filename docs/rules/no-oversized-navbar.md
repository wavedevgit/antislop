# Oversized navbar

![Oversized navbar example](./assets/no-oversized-navbar.png)

AI-generated websites often use desktop navigation bars taller than the content requires.

## How it works

Measures desktop navigation height and reports bars taller than 64px.

## How to fix

Reduce vertical padding or control sizes so desktop navigation stays at or below 64px unless extra height serves a clear purpose.

## Common false positives

Touch-first kiosks, accessibility modes, and navigation containing a second functional row may need more height.

## Scan support

| File scan | Browser scan |
| --- | --- |
| <span class="status-ok">Supported</span> | <span class="status-ok">Supported</span> |
