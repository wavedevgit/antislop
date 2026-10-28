import { clampChroma, converter, formatHex, interpolate, parse, wcagContrast, type Color, type Oklch } from "culori";

const toOklch = converter("oklch");

function readColor(value: string): Color {
  const color = parse(value);

  if (!color) throw new Error(`Invalid CSS color: ${value}`);

  if (color.alpha !== undefined && color.alpha < 1) throw new Error(`Color must be opaque: ${value}`);

  return color;
}

function hex(color: Color): string {
  return formatHex(clampChroma(color, "oklch"));
}

function ratio(foreground: Color | string, background: Color | string): number {
  return Math.round(wcagContrast(foreground, background) * 100) / 100;
}

export function checkContrast(foregroundValue: string, backgroundValue: string) {
  const foreground = hex(readColor(foregroundValue));
  const background = hex(readColor(backgroundValue));
  const contrast = ratio(foreground, background);

  return {
    foreground,
    background,
    ratio: contrast,
    wcag: {
      normalText: { AA: contrast >= 4.5, AAA: contrast >= 7 },
      largeText: { AA: contrast >= 3, AAA: contrast >= 4.5 },
      uiComponents: { AA: contrast >= 3 },
    },
  };
}

function shiftLightness(color: Oklch, amount: number): string {
  return hex({ ...color, l: Math.max(0, Math.min(1, color.l + amount)) });
}

function accessibleText(accent: Oklch, background: Color): string {
  const original = hex(accent);

  if (wcagContrast(original, background) >= 4.5) return original;

  let closest: { color: string; distance: number } | undefined;

  for (let step = 0; step <= 1000; step += 1) {
    const l = step / 1000;
    const color = shiftLightness(accent, l - accent.l);
    const distance = Math.abs(l - accent.l);

    if (wcagContrast(color, background) >= 4.5 && (!closest || distance < closest.distance)) {
      closest = { color, distance };
    }
  }

  return closest?.color ?? (wcagContrast("#000", background) > wcagContrast("#fff", background) ? "#000000" : "#ffffff");
}

export function createColorRoles(accentValue: string, backgroundValue = "white") {
  const accent = readColor(hex(readColor(accentValue)));
  const background = readColor(hex(readColor(backgroundValue)));
  const oklch = toOklch(accent);

  if (!oklch) throw new Error(`Could not convert CSS color: ${accentValue}`);

  const direction = oklch.l < 0.25 ? 1 : -1;
  const base = hex(accent);
  const hover = shiftLightness(oklch, 0.06 * direction);
  const active = shiftLightness(oklch, 0.1 * direction);
  const blackMinimum = Math.min(wcagContrast("#000", base), wcagContrast("#000", hover), wcagContrast("#000", active));
  const whiteMinimum = Math.min(wcagContrast("#fff", base), wcagContrast("#fff", hover), wcagContrast("#fff", active));
  const onAccent = blackMinimum > whiteMinimum ? "#000000" : "#ffffff";
  const mix = interpolate([background, accent], "oklab");
  const text = accessibleText(oklch, background);

  return {
    accent: base,
    background: hex(background),
    text,
    textContrast: ratio(text, background),
    onAccent,
    onAccentContrast: {
      accent: ratio(onAccent, base),
      hover: ratio(onAccent, hover),
      active: ratio(onAccent, active),
    },
    hover,
    active,
    subtle: hex(mix(0.1)),
    border: hex(mix(0.3)),
  };
}
