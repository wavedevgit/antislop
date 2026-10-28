# Hero heading over three lines

![Hero heading over three lines example](./assets/limit-hero-heading-lines.png)

Hero headings should stay within three lines so the opening message remains concise and scannable.

## How it works

Counts the rendered lines in the first visible level-one heading. File scans detect headings explicitly split across four or more lines with `<br>` tags.

## How to fix

Shorten the headline, widen its text measure, or reduce its font size at the affected breakpoint. Keep the message readable rather than forcing line breaks.

## Common false positives

Narrow screens and intentionally editorial hero layouts may need more than three lines. Check every supported breakpoint before changing the copy.

## Scan support

| File scan | Browser scan |
| --- | --- |
| <span class="status-ok">Supported</span> | <span class="status-ok">Supported</span> |
