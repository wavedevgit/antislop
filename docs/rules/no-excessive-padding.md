# Excessive padding

![Excessive padding example](./assets/no-excessive-padding.png)

AI-generated sites often add large amounts of padding to ordinary elements without a clear layout reason.

## How it works

Finds ordinary elements with at least 48px of padding and compact cards with at least 24px.

## How to fix

Reduce padding until the element supports its content without looking empty. Put larger whitespace between sections rather than inside every component.

## Common false positives

Touch targets, sparse hero sections, and deliberate display compositions may require large internal space.

## Scan support

| File scan | Browser scan |
| --- | --- |
| <span class="status-ok">Supported</span> | <span class="status-ok">Supported</span> |
