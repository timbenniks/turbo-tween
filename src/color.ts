import type { ParsedColor } from './types';

const HEX3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX4 = /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const HEX8 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const RGB = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/;
const HSL = /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)$/;

/** Check if a string looks like a color value */
export function isColorValue(value: string): boolean {
  return value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl');
}

/** Parse a color string into r, g, b, a (0-255 for rgb, 0-1 for a) */
export function parseColor(value: string): ParsedColor | null {
  let match: RegExpMatchArray | null;

  // #rgb
  match = value.match(HEX3);
  if (match) {
    return {
      r: parseInt(match[1]! + match[1]!, 16),
      g: parseInt(match[2]! + match[2]!, 16),
      b: parseInt(match[3]! + match[3]!, 16),
      a: 1,
    };
  }

  // #rgba
  match = value.match(HEX4);
  if (match) {
    return {
      r: parseInt(match[1]! + match[1]!, 16),
      g: parseInt(match[2]! + match[2]!, 16),
      b: parseInt(match[3]! + match[3]!, 16),
      a: parseInt(match[4]! + match[4]!, 16) / 255,
    };
  }

  // #rrggbb
  match = value.match(HEX6);
  if (match) {
    return {
      r: parseInt(match[1]!, 16),
      g: parseInt(match[2]!, 16),
      b: parseInt(match[3]!, 16),
      a: 1,
    };
  }

  // #rrggbbaa
  match = value.match(HEX8);
  if (match) {
    return {
      r: parseInt(match[1]!, 16),
      g: parseInt(match[2]!, 16),
      b: parseInt(match[3]!, 16),
      a: parseInt(match[4]!, 16) / 255,
    };
  }

  // rgb() / rgba()
  match = value.match(RGB);
  if (match) {
    return {
      r: parseInt(match[1]!, 10),
      g: parseInt(match[2]!, 10),
      b: parseInt(match[3]!, 10),
      a: match[4] !== undefined ? parseFloat(match[4]) : 1,
    };
  }

  // hsl() / hsla()
  match = value.match(HSL);
  if (match) {
    return hslToRgb(
      parseFloat(match[1]!),
      parseFloat(match[2]!),
      parseFloat(match[3]!),
      match[4] !== undefined ? parseFloat(match[4]) : 1,
    );
  }

  return null;
}

/** Interpolate between two parsed colors in linear RGB */
export function interpolateColor(
  from: ParsedColor,
  to: ParsedColor,
  progress: number,
): ParsedColor {
  return {
    r: Math.round(from.r + (to.r - from.r) * progress),
    g: Math.round(from.g + (to.g - from.g) * progress),
    b: Math.round(from.b + (to.b - from.b) * progress),
    a: from.a + (to.a - from.a) * progress,
  };
}

/** Convert a parsed color to an rgba() string */
export function colorToString(color: ParsedColor): string {
  if (color.a === 1) {
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  }
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

/** Convert HSL to RGB */
function hslToRgb(h: number, s: number, l: number, a: number): ParsedColor {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a,
  };
}

function hueToRgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}
