# GPT-5.6 Luna repeated designs

Five pages were generated independently by GPT-5.6 Luna without reading or being guided by the AntiSlop rules:

- `01-station.html` — train station
- `02-mountain.html` — mountain weather service
- `03-records.html` — used record shop
- `04-legal-aid.html` — legal aid clinic
- `05-pool.html` — community swimming pool

## Existing rule hits

The batch triggered Unicode bullets, cream colors, text arrows, em dashes, and emojis. It did not trigger the oversized CTA heading rule. There are no inline SVG illustrations in this batch.

## Repeated patterns not currently covered

| Pattern | Pages | Evidence |
| --- | ---: | --- |
| Hero-led page structure with a dominant opening headline | 5/5 | Every page uses a `.hero` section and an opening `h1`. | 
| Boxed/panelized content modules | 5/5 | Board, cards, records, aid cards, schedule/utility boxes. | 
| Grid/flex composition as the primary layout system | 5/5 | Every page uses CSS grid or flex for major layout. | 
| Small utility labels with tracking or uppercase styling | 4/5 | Eyebrows, weather labels, shop filters, and service labels. | 
| Top navigation or branded site chrome | 4/5 | Station, mountain, records, and pool pages have a distinct top bar/header/nav. | 

## Best candidates for new rules

1. **`panelized-content`** — flag pages that turn most sections into bordered or filled boxes/cards, requiring several repeated surfaces rather than one isolated card.
2. **`hero-template`** — flag a generic hero with a short label, large heading, supporting copy, and primary action. Require multiple signals to avoid penalizing legitimate homepages.
3. **`utility-label-overuse`** — flag repeated small uppercase/tracked labels across sections, separate from the existing eyebrow-over-title rule.

The first two are stronger candidates than a generic “uses grid/flex” rule, which would be too broad to be useful.
