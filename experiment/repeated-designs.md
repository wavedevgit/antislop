# Repeated designs

Generated blind by DeepSeek V4.1 Flash and MiMo V2.6 Flash. Ten pages were reviewed: five topics per model, with no design constraints in the generation prompt.

## Existing rule coverage

The current ruleset has 16 visual rules:

- eyebrows over titles, Unicode bullets, visible gradients, dotted/grid backgrounds
- cream backgrounds, cards inside cards, fake-logo cards, text arrows
- decorative monospace, overused fonts, mostly italic titles, neon borders
- soft corners everywhere, too many em dashes, too many emojis, one HTML file

The sample pages triggered existing rules for bullets, gradients, patterned backgrounds, cream colors, monospace, overused fonts, italic-heavy titles, em dashes, and emojis. The generated pages themselves are retained unchanged.

## Most repeated uncovered patterns

Counts are pages out of 10, not occurrences within a page. These are design patterns rather than universal HTML requirements.

| Rank | Repeated pattern | Pages | Evidence | Covered by current rules? |
| --- | --- | ---: | --- | --- |
| 1 | Oversized display headline as the hero’s primary visual | 10/10 | Every page opens with a large, multi-line or dominant `h1` beside the main artwork/content. | No |
| 2 | Bespoke inline SVG illustration, diagram, or data visual | 10/10 | All ten HTML files contain inline `<svg>` artwork used as a hero, instrument, object, or chart. | No; `fake-logo` is narrower and does not cover general artwork. |
| 3 | Small uppercase/letter-spaced micro-labels | 8/10 | Kicker, status, category, schedule, and section labels repeatedly use `text-transform: uppercase` with positive `letter-spacing`. | Partly; `eyebrow-over-all-titles` only addresses labels placed over titles. |
| 4 | Editorial split hero: copy/CTA on one side, visual or panel on the other | 9/10 | All five DeepSeek pages and four MiMo pages use a two-column hero composition; the radio page is the exception. | No |
| 5 | Branded lockup plus utility metadata/status strip | 10/10 | Each page combines a compact brand mark/name with navigation and a row of hours, location, live status, frequency, or booking metadata. | No |
| 6 | Dashboard-like metric panels for an ordinary informational site | 8/10 | Pages use schedules, specs, prices, readings, tables, or status cards as prominent visual modules rather than plain prose. | No |

## Suggested rule candidates

The best additions are the patterns with both high repetition and a reasonably observable signal:

1. **`hero-headline-dominates`** — flag an oversized hero heading that dominates the first viewport when paired with a generic CTA/marketing layout. Avoid flagging editorial or campaign pages solely because they have a large heading.
2. **`inline-svg-art-direction`** — flag repeated decorative inline SVG artwork when it is used as generic page decoration rather than meaningful data, branding, or product UI. This needs a higher evidence threshold than “contains SVG.”
3. **`tracked-micro-labels`** — flag excessive uppercase labels with wide tracking when they appear across most sections. A single navigation or status label should not match.
4. **`split-hero-template`** — flag a generic two-column hero with a large headline, short lede, CTA, and adjacent visual. Require multiple signals so legitimate landing pages are not penalized.
5. **`dashboard-as-marketing-page`** — flag dense metric/status modules when a non-dashboard site uses them repeatedly as decorative credibility signals. This is the most subjective candidate and should remain lower priority.

## Experiment index

- `deepseek/01-library.html` — public library
- `deepseek/02-bakery.html` — neighborhood bakery
- `deepseek/03-marine-lab.html` — marine research lab
- `deepseek/04-bike-repair.html` — bicycle repair service
- `deepseek/05-theater.html` — local theater
- `mimo/01-garden.html` — urban gardening club
- `mimo/02-observatory.html` — astronomy observatory
- `mimo/03-hotel.html` — small coastal hotel
- `mimo/04-radio.html` — community radio station
- `mimo/05-ceramics.html` — ceramics studio
