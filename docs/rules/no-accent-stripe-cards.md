# Accent stripe cards

![Accent stripe cards example](./assets/no-accent-stripe-cards.png)

AI-generated landing pages often decorate rounded cards with a thick colored stripe along the top or left edge.

## How it works

Finds card-like elements with a thick colored top or left border, or an inset box-shadow stripe such as `box-shadow: inset 2px 0 var(--accent)`.

## How to fix

Remove the thick accent edge. Use spacing, type weight, or a subtle uniform border to establish hierarchy.

## Common false positives

Status panels and brand components may use an edge color to communicate real state or identity.

## Scan support

| File scan | Browser scan |
| --- | --- |
| <span class="status-ok">Supported</span> | <span class="status-ok">Supported</span> |
