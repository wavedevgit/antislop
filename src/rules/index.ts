import type { Rule } from "../api/index.ts";

import accentStripeCard from "./accent-stripe-card/index.ts";
import bullets from "./bullets/index.ts";
import cardInCard from "./card-in-card/index.ts";
import creamColors from "./cream-colors/index.ts";
import excessiveLetterSpacing from "./excessive-letter-spacing/index.ts";
import eyebrowOverAllTitles from "./eyebrow-over-all-titles/index.ts";
import fakeLogo from "./fake-logo/index.ts";
import gradients from "./gradients/index.ts";
import headlineBadge from "./headline-badge/index.ts";
import monospaceFont from "./monospace-font/index.ts";
import mostlyItalicTitles from "./mostly-italic-titles/index.ts";
import neonBorder from "./neon-border/index.ts";
import noBuzzwords from "./no-buzzwords/index.ts";
import oneHtmlFile from "./one-html-file/index.ts";
import excessivePadding from "./excessive-padding/index.ts";
import oversizedCtaHeading from "./oversized-cta-heading/index.ts";
import overusedFonts from "./overused-fonts/index.ts";
import patternedBackground from "./patterned-background/index.ts";
import softCornersEverywhere from "./soft-corners-everywhere/index.ts";
import dividedListRows from "./divided-list-rows/index.ts";
import textArrow from "./text-arrow/index.ts";
import tooManyEmDashes from "./too-many-em-dashes/index.ts";
import tooManyEmojis from "./too-many-emojis/index.ts";

export const rules: Rule[] = [
  accentStripeCard,
  eyebrowOverAllTitles,
  bullets,
  gradients,
  headlineBadge,
  patternedBackground,
  creamColors,
  excessiveLetterSpacing,
  cardInCard,
  fakeLogo,
  textArrow,
  monospaceFont,
  overusedFonts,
  mostlyItalicTitles,
  neonBorder,
  noBuzzwords,
  softCornersEverywhere,
  dividedListRows,
  tooManyEmDashes,
  tooManyEmojis,
  oneHtmlFile,
  excessivePadding,
  oversizedCtaHeading,
];
