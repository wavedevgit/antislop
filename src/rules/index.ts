import type { Rule } from "../api/index.ts";

import bullets from "./bullets/index.ts";
import cardInCard from "./card-in-card/index.ts";
import eyebrowOverAllTitles from "./eyebrow-over-all-titles/index.ts";
import fakeLogo from "./fake-logo/index.ts";
import gradients from "./gradients/index.ts";
import oneHtmlFile from "./one-html-file/index.ts";
import tooManyEmDashes from "./too-many-em-dashes/index.ts";
import tooManyEmojis from "./too-many-emojis/index.ts";

export const rules: Rule[] = [
  eyebrowOverAllTitles,
  bullets,
  gradients,
  cardInCard,
  fakeLogo,
  tooManyEmDashes,
  tooManyEmojis,
  oneHtmlFile,
];
