import type { Rule } from "../api/index.ts";

import bullets from "./bullets/index.ts";
import cardInCard from "./card-in-card/index.ts";
import creamColors from "./cream-colors/index.ts";
import eyebrowOverAllTitles from "./eyebrow-over-all-titles/index.ts";
import fakeLogo from "./fake-logo/index.ts";
import gradients from "./gradients/index.ts";
import monospaceFont from "./monospace-font/index.ts";
import mostlyItalicTitles from "./mostly-italic-titles/index.ts";
import neonBorder from "./neon-border/index.ts";
import oneHtmlFile from "./one-html-file/index.ts";
import overusedFonts from "./overused-fonts/index.ts";
import patternedBackground from "./patterned-background/index.ts";
import softCornersEverywhere from "./soft-corners-everywhere/index.ts";
import textArrow from "./text-arrow/index.ts";
import tooManyEmDashes from "./too-many-em-dashes/index.ts";
import tooManyEmojis from "./too-many-emojis/index.ts";

export const rules: Rule[] = [
  eyebrowOverAllTitles,
  bullets,
  gradients,
  patternedBackground,
  creamColors,
  cardInCard,
  fakeLogo,
  textArrow,
  monospaceFont,
  overusedFonts,
  mostlyItalicTitles,
  neonBorder,
  softCornersEverywhere,
  tooManyEmDashes,
  tooManyEmojis,
  oneHtmlFile,
];
