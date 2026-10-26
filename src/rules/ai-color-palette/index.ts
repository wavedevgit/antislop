import { defineRule, type Files } from "../../api/index.ts";
import { cssRules } from "../shared/styles.ts";

type Color = { red: number; green: number; blue: number };

type Palette = {
  name: string;
  colors: Color[];
  range?: {
    hue: [number, number];
    saturation: [number, number];
    lightness: [number, number];
  };
  named: Array<[string, Color]>;
  utilities: string[];
};

const aiColorPalettes: Palette[] = [{
  name: "cream",
  colors: [],
  range: {
    hue: [25, 60],
    saturation: [0.1, 1],
    lightness: [0.85, 0.98],
  },
  named: [
    ["antiquewhite", { red: 250, green: 235, blue: 215 }],
    ["floralwhite", { red: 255, green: 250, blue: 240 }],
    ["linen", { red: 250, green: 240, blue: 230 }],
    ["oldlace", { red: 253, green: 245, blue: 230 }],
  ],
  utilities: ["amber-50", "orange-50", "yellow-50", "cream", "floralwhite", "linen", "oldlace"],
}, {
  name: "indigo",
  colors: [{ red: 79, green: 70, blue: 229 }],
  named: [],
  utilities: ["indigo-600"],
}, {
  name: "neon green",
  colors: [{ red: 0, green: 255, blue: 0 }],
  named: [["lime", { red: 0, green: 255, blue: 0 }]],
  utilities: [],
}];

function parseColor(value: string): Color | undefined {
  const name = value.trim().toLowerCase();
  const named = aiColorPalettes.flatMap((palette) => palette.named).find(([candidate]) => candidate === name)?.[1];

  if (named) {
    return named;
  }

  const hex = value.match(/#([\da-f]{3}|[\da-f]{6})\b/i)?.[1];

  if (hex) {
    const expanded = hex.length === 3 ? Array.from(hex, (part) => part + part).join("") : hex;

    return {
      red: Number.parseInt(expanded.slice(0, 2), 16),
      green: Number.parseInt(expanded.slice(2, 4), 16),
      blue: Number.parseInt(expanded.slice(4, 6), 16),
    };
  }

  const rgb = value.match(/rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i);

  return rgb ? { red: Number(rgb[1]), green: Number(rgb[2]), blue: Number(rgb[3]) } : undefined;
}

function isAiColor(color: Color): boolean {
  const { red, green, blue } = color;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const difference = maximum - minimum;
  const lightness = (maximum + minimum) / 510;
  const saturation = difference === 0 ? 0 : difference / (255 - Math.abs(maximum + minimum - 255));
  let hue = 0;

  if (difference > 0) {
    if (maximum === red) {
      hue = 60 * (((green - blue) / difference) % 6);
    } else if (maximum === green) {
      hue = 60 * ((blue - red) / difference + 2);
    } else {
      hue = 60 * ((red - green) / difference + 4);
    }
  }

  hue = hue < 0 ? hue + 360 : hue;

  return aiColorPalettes.some((palette) => palette.colors.some((known) => known.red === red && known.green === green && known.blue === blue)
    || (palette.range !== undefined
      && hue >= palette.range.hue[0] && hue <= palette.range.hue[1]
      && saturation >= palette.range.saturation[0] && saturation <= palette.range.saturation[1]
      && lightness >= palette.range.lightness[0] && lightness <= palette.range.lightness[1]));
}

function declarationIsAiColor(value: string): boolean {
  const background = value.match(/\bbackground(?:-color)?\s*:\s*([^;]+)/i)?.[1];
  const parsed = background ? parseColor(background) : undefined;

  return parsed !== undefined && isAiColor(parsed);
}

function sourceAiColors(files: Files): number {
  let matches = cssRules(files).filter((rule) => declarationIsAiColor(rule.declarations)).length;

  for (const file of files.all()) {
    for (const style of file.content.matchAll(/style\s*=\s*(["'])(.*?)\1/gi)) {
      matches += declarationIsAiColor(style[2] ?? "") ? 1 : 0;
    }

    for (const arbitrary of file.content.matchAll(/\bbg-\[(#[\da-f]{3,6})\]/gi)) {
      const parsed = parseColor(arbitrary[1] ?? "");

      matches += parsed && isAiColor(parsed) ? 1 : 0;
    }

    for (const attribute of file.content.matchAll(/(?:class|className)\s*=\s*(["'])(.*?)\1/g)) {
      matches += attribute[2]?.split(/\s+/).filter((name) => {
        const utility = name.slice(name.lastIndexOf(":") + 1).replace(/\/\d+$/, "");

        return utility.startsWith("bg-") && aiColorPalettes.some((palette) => palette.utilities.includes(utility.slice(3)));
      }).length ?? 0;
    }
  }

  return matches;
}

export default defineRule({
  id: "no-ai-color-palette",
  title: "AI color palette",
  description: "Avoid color palettes that have become recognizable defaults in AI-generated interfaces.",
  async match(context) {
    const result = context.type === "puppeteer"
      ? await context.page.$$eval("*", (elements, palettes) => elements.flatMap((element) => {
        const match = getComputedStyle(element).backgroundColor.match(/rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i);

        if (!match || element.getClientRects().length === 0) {
          return [];
        }

        const red = Number(match[1]);
        const green = Number(match[2]);
        const blue = Number(match[3]);
        const maximum = Math.max(red, green, blue);
        const minimum = Math.min(red, green, blue);
        const difference = maximum - minimum;
        const lightness = (maximum + minimum) / 510;
        const saturation = difference === 0 ? 0 : difference / (255 - Math.abs(maximum + minimum - 255));
        let hue = 0;

        if (difference > 0) {
          if (maximum === red) {
            hue = 60 * (((green - blue) / difference) % 6);
          } else if (maximum === green) {
            hue = 60 * ((blue - red) / difference + 2);
          } else {
            hue = 60 * ((red - green) / difference + 4);
          }
        }

        hue = hue < 0 ? hue + 360 : hue;

        const matches = palettes.some((palette) => palette.colors.some((known) => known.red === red && known.green === green && known.blue === blue)
          || (palette.range !== undefined
            && hue >= palette.range.hue[0] && hue <= palette.range.hue[1]
            && saturation >= palette.range.saturation[0] && saturation <= palette.range.saturation[1]
            && lightness >= palette.range.lightness[0] && lightness <= palette.range.lightness[1]));

        if (!matches) {
          return [];
        }

        const path: string[] = [];
        let current: Element | null = element;

        while (current) {
          const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
          const position = siblings.indexOf(current) + 1;

          path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${position}]` : ""}`);
          current = current.parentElement;
        }

        const selector = element.id ? `#${CSS.escape(element.id)}` : `xpath=/${path.join("/")}`;

        return [{ type: "element" as const, selector, source: element.outerHTML.slice(0, 200) }];
      }), aiColorPalettes.map(({ colors, range }) => ({ colors, range })))
      : sourceAiColors(context.files);

    const matches = Array.isArray(result) ? result.length : result;

    return matches > 0
      ? { matches: true, explanation: `${matches} known AI-palette ${matches === 1 ? "background was" : "backgrounds were"} found.`, references: Array.isArray(result) ? result : undefined }
      : { matches: false };
  },
});
