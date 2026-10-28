# Excessive letter spacing

![Excessive letter spacing example](./assets/no-excessive-letter-spacing.png)

AI-generated sites often add positive tracking to ordinary text and labels.

## How it works

Finds positive `letter-spacing` values and Tailwind's `tracking-wide`, `tracking-wider`, and `tracking-widest` utilities. Zero and negative tracking such as `tracking-tight` are allowed.

## How to fix

Return ordinary text to normal tracking. Use modest tracking only where the chosen typeface or short uppercase label requires it.

## Common false positives

Logotypes and typefaces with documented tracking requirements may need positive letter spacing.

## Scan support

| File scan | Browser scan |
| --- | --- |
| <span class="status-ok">Supported</span> | <span class="status-ok">Supported</span> |
