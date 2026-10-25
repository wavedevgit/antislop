import type { Rule } from "../api/index.ts";

import accentStripeCard from "./accent-stripe-card/index.ts";
import alignmentProblems from "./alignment-problems/index.ts";
import auroraBackground from "./aurora-background/index.ts";
import bullets from "./bullets/index.ts";
import cardInCard from "./card-in-card/index.ts";
import creamColors from "./cream-colors/index.ts";
import crampedHeaderSpacing from "./cramped-header-spacing/index.ts";
import excessiveLetterSpacing from "./excessive-letter-spacing/index.ts";
import extremeCardRadius from "./extreme-card-radius/index.ts";
import eyebrowOverAllTitles from "./eyebrow-over-all-titles/index.ts";
import fakeLogo from "./fake-logo/index.ts";
import glassmorphismEverywhere from "./glassmorphism-everywhere/index.ts";
import gradients from "./gradients/index.ts";
import ghostCard from "./ghost-card/index.ts";
import headlineBadge from "./headline-badge/index.ts";
import inconsistentButtonRadius from "./inconsistent-button-radius/index.ts";
import lineBeforeLabel from "./line-before-label/index.ts";
import monospaceFont from "./monospace-font/index.ts";
import mostlyItalicTitles from "./mostly-italic-titles/index.ts";
import navbarThemeToggle from "./navbar-theme-toggle/index.ts";
import neonBorder from "./neon-border/index.ts";
import noBuzzwords from "./no-buzzwords/index.ts";
import noMetaTags from "./no-meta-tags/index.ts";
import oneHtmlFile from "./one-html-file/index.ts";
import oversizedNavbar from "./oversized-navbar/index.ts";
import excessivePadding from "./excessive-padding/index.ts";
import oversizedCtaHeading from "./oversized-cta-heading/index.ts";
import overusedFonts from "./overused-fonts/index.ts";
import patternedBackground from "./patterned-background/index.ts";
import pillButtons from "./pill-buttons/index.ts";
import softCornersEverywhere from "./soft-corners-everywhere/index.ts";
import slopIcons from "./slop-icons/index.ts";
import dividedListRows from "./divided-list-rows/index.ts";
import textArrow from "./text-arrow/index.ts";
import thickColoredCardBorder from "./thick-colored-card-border/index.ts";
import tooManyEmDashes from "./too-many-em-dashes/index.ts";
import tooManyEmojis from "./too-many-emojis/index.ts";
import unstyledTextButton from "./unstyled-text-button/index.ts";

export const rules: Rule[] = [
  accentStripeCard,
  alignmentProblems,
  auroraBackground,
  eyebrowOverAllTitles,
  bullets,
  gradients,
  headlineBadge,
  inconsistentButtonRadius,
  lineBeforeLabel,
  patternedBackground,
  pillButtons,
  creamColors,
  crampedHeaderSpacing,
  excessiveLetterSpacing,
  extremeCardRadius,
  cardInCard,
  fakeLogo,
  glassmorphismEverywhere,
  ghostCard,
  textArrow,
  thickColoredCardBorder,
  monospaceFont,
  overusedFonts,
  mostlyItalicTitles,
  navbarThemeToggle,
  neonBorder,
  noBuzzwords,
  noMetaTags,
  softCornersEverywhere,
  slopIcons,
  dividedListRows,
  tooManyEmDashes,
  tooManyEmojis,
  oneHtmlFile,
  oversizedNavbar,
  excessivePadding,
  oversizedCtaHeading,
  unstyledTextButton,
];
