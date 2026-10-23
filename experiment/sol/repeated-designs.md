# GPT-5.6 Sol repeated designs

Five pages were generated independently by GPT-5.6 Sol without reading or being guided by the AntiSlop rules:

- `01-garden.html` — botanical garden
- `02-repair-cafe.html` — repair café
- `03-ferry.html` — ferry service
- `04-observatory.html` — public observatory
- `05-market.html` — regional food market

## Existing rule hits

The batch triggered Unicode bullets, visible gradients, a patterned background, cream colors, text arrows, monospace fonts, em dashes, and oversized CTA headings.

## Repeated patterns not currently covered

| Pattern | Pages | Evidence |
| --- | ---: | --- |
| Hero-led page with a dominant opening headline | 5/5 | Every page has a `.hero` section and an opening `h1`. |
| Grid/flex as the main composition system | 5/5 | Every page uses grid or flex for major sections. |
| Uppercase or tracked utility labels | 5/5 | Kicker, status, date, booking, and section labels use this treatment. |
| Box-shadow applied to content surfaces | 5/5 | Every page uses shadowed cards, panels, or controls. |
| Repeated boxed content modules | 5/5 | Garden notes, repair boards, timetables, observatory panels, and market tiles. |
| Decorative inline SVG or illustration | 4/5 | Garden, repair café, ferry, and observatory use inline SVG/illustrative artwork. |

## Best candidates for new rules

1. **`shadowed-surfaces-everywhere`** — flag repeated non-interactive cards/panels using box shadows, with a count and ratio threshold.
2. **`utility-label-overuse`** — flag excessive uppercase/tracked labels across sections.
3. **`panelized-content`** — flag pages where most content is split into repeated bordered or filled tiles.
4. **`decorative-svg-overuse`** — flag several inline SVGs used as decoration rather than meaningful data or branding.

Generic grid/flex usage should not become a rule by itself; it is too common to indicate slop.
