import { defineRule, type Files } from "../../api/index.ts";
import { cssClassStyles, sourceCardStyle, voidElements } from "../shared/cards.ts";

type Color = { red: number; green: number; blue: number };

function parseColor(value: string): Color | undefined {
  const normalized = value.replace(/^\[|\]$/g, "");
  const hex = normalized.match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1];

  if (hex) {
    const expanded = hex.length === 3
      ? Array.from(hex, (character) => character + character).join("")
      : hex;

    return {
      red: Number.parseInt(expanded.slice(0, 2), 16),
      green: Number.parseInt(expanded.slice(2, 4), 16),
      blue: Number.parseInt(expanded.slice(4, 6), 16),
    };
  }

  const named = new Map<string, Color>([
    ["black", { red: 0, green: 0, blue: 0 }],
    ["white", { red: 255, green: 255, blue: 255 }],
  ]);

  return named.get(normalized);
}

function hueAndSaturation(color: Color) {
  const red = color.red / 255;
  const green = color.green / 255;
  const blue = color.blue / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const difference = maximum - minimum;
  const lightness = (maximum + minimum) / 2;
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

  return {
    hue: hue < 0 ? hue + 360 : hue,
    saturation: difference === 0 ? 0 : difference / (1 - Math.abs(2 * lightness - 1)),
  };
}

function areShades(first: string, second: string): boolean | undefined {
  const firstFamily = first.match(/^(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-|$)/)?.[1];
  const secondFamily = second.match(/^(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-|$)/)?.[1];

  if (firstFamily && secondFamily) {
    const neutrals = new Set(["slate", "gray", "zinc", "neutral", "stone"]);

    return firstFamily === secondFamily || (neutrals.has(firstFamily) && neutrals.has(secondFamily));
  }

  const firstColor = parseColor(first);
  const secondColor = parseColor(second);

  if (!firstColor || !secondColor) {
    return undefined;
  }

  const firstHsl = hueAndSaturation(firstColor);
  const secondHsl = hueAndSaturation(secondColor);

  if (firstHsl.saturation < 0.15 && secondHsl.saturation < 0.15) {
    return true;
  }

  if (firstHsl.saturation < 0.15 || secondHsl.saturation < 0.15) {
    return false;
  }

  const hueDistance = Math.abs(firstHsl.hue - secondHsl.hue);

  return Math.min(hueDistance, 360 - hueDistance) <= 30;
}

function countSourceLogos(files: Files): number {
  const classStyles = cssClassStyles(files);
  const logos = new Set<number>();
  let nextCard = 0;

  for (const file of files.all()) {
    const stack: Array<{ tag: string; card?: { id: number; color?: string } }> = [];

    for (const tagMatch of file.content.matchAll(/<\s*(\/)?\s*([A-Za-z][\w.-]*)([^>]*)>/g)) {
      const closing = Boolean(tagMatch[1]);
      const tag = tagMatch[2]?.toLowerCase();
      const attributes = tagMatch[3] ?? "";

      if (!tag) {
        continue;
      }

      if (closing) {
        let opening = stack.length - 1;

        while (opening >= 0 && stack[opening]?.tag !== tag) {
          opening -= 1;
        }

        if (opening >= 0) {
          stack.length = opening;
        }

        continue;
      }

      if (tag === "svg") {
        const cards = [];

        for (let index = stack.length - 1; index >= 0 && cards.length < 2; index -= 1) {
          const card = stack[index]?.card;

          if (card) {
            cards.push(card);
          }
        }

        const logo = cards[0];
        const parent = cards[1];

        if (logo?.color && parent?.color && areShades(logo.color, parent.color) === false) {
          logos.add(logo.id);
        }
      }

      const style = sourceCardStyle(attributes, classStyles);

      const card = style.rounded && style.background
        ? { id: nextCard++, color: style.color }
        : undefined;

      if (!attributes.trimEnd().endsWith("/") && !voidElements.has(tag)) {
        stack.push({ tag, card });
      }
    }
  }

  return logos.size;
}

export default defineRule({
  id: "fake-logo",
  title: "Contrasting SVG logo card",
  description: "AI-generated websites often place a generic SVG in a logo card whose color clashes with its parent card.",
  async match(context) {
    const result = context.type === "puppeteer"
      ? await context.page.$$eval("svg", (svgs) => {
        type BrowserColor = { red: number; green: number; blue: number; alpha: number };

        function colorOf(element: Element): BrowserColor | undefined {
          const match = getComputedStyle(element).backgroundColor.match(/rgba?\(([^)]*)\)/)?.[1];

          if (!match) {
            return undefined;
          }

          const parts = match.split(",").map(Number);
          const color = { red: parts[0] ?? 0, green: parts[1] ?? 0, blue: parts[2] ?? 0, alpha: parts[3] ?? 1 };

          return color.alpha > 0 ? color : undefined;
        }

        function isCard(element: Element): BrowserColor | undefined {
          const style = getComputedStyle(element);

          const rounded = [
            style.borderTopLeftRadius,
            style.borderTopRightRadius,
            style.borderBottomLeftRadius,
            style.borderBottomRightRadius,
          ].some((radius) => Number.parseFloat(radius) > 0);

          return rounded && element.getClientRects().length > 0 ? colorOf(element) : undefined;
        }

        function hsl(color: BrowserColor) {
          const red = color.red / 255;
          const green = color.green / 255;
          const blue = color.blue / 255;
          const maximum = Math.max(red, green, blue);
          const minimum = Math.min(red, green, blue);
          const difference = maximum - minimum;
          const lightness = (maximum + minimum) / 2;
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

          return {
            hue: hue < 0 ? hue + 360 : hue,
            saturation: difference === 0 ? 0 : difference / (1 - Math.abs(2 * lightness - 1)),
          };
        }

        function shades(first: BrowserColor, second: BrowserColor): boolean {
          const firstHsl = hsl(first);
          const secondHsl = hsl(second);

          if (firstHsl.saturation < 0.15 && secondHsl.saturation < 0.15) {
            return true;
          }

          if (firstHsl.saturation < 0.15 || secondHsl.saturation < 0.15) {
            return false;
          }

          const distance = Math.abs(firstHsl.hue - secondHsl.hue);

          return Math.min(distance, 360 - distance) <= 30;
        }

        const logos = new Set<Element>();

        for (const svg of svgs) {
          let element = svg.parentElement;
          let logo: { element: Element; color: BrowserColor } | undefined;

          while (element) {
            const color = isCard(element);

            if (color) {
              if (!logo) {
                logo = { element, color };
              } else {
                if (!shades(logo.color, color)) {
                  logos.add(logo.element);
                }

                break;
              }
            }

            element = element.parentElement;
          }
        }

        return Array.from(logos, (element) => {
          const path: string[] = [];
          let current: Element | null = element;

          while (current) {
            const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
            const position = siblings.indexOf(current) + 1;

            path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${position}]` : ""}`);
            current = current.parentElement;
          }

          return {
            type: "element" as const,
            selector: element.id ? `#${CSS.escape(element.id)}` : `xpath=/${path.join("/")}`,
            source: element.outerHTML.slice(0, 200),
          };
        });
      }).then((references) => ({ count: references.length, references }))
      : { count: countSourceLogos(context.files), references: undefined };

    return result.count > 0
      ? { matches: true, explanation: `${result.count} SVG logo cards use a different color family from their parent card.`, references: result.references }
      : { matches: false };
  },
});
