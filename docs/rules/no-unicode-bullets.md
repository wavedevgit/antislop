# Unicode bullets

![Unicode bullets example](./assets/no-unicode-bullets.png)

AI-generated website copy often uses the Unicode bullet character as decoration.

## How it works

Counts literal Unicode bullet characters used in page copy.

## How to fix

Use a semantic HTML list for list content. Remove the character when it is only decorative.

## Common false positives

Plain-text excerpts, user-generated content, and formats without list markup may legitimately contain bullet characters.

## Scan support

| File scan | Browser scan |
| --- | --- |
| <span class="status-ok">Supported</span> | <span class="status-ok">Supported</span> |
