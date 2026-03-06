import { isElement, toKebabCase } from './utils';
import { isColorValue, parseColor, interpolateColor, colorToString } from './color';
import type { AnimatableTarget, ParsedColor } from './types';

const UNIT_RE = /(px|%|em|rem|vh|vw|vmin|vmax|deg|rad|turn)$/;

/** Represents a single animatable property with its start/end values */
export interface PropertyAnimation {
  property: string;
  startNum: number;
  endNum: number;
  unit: string;
  isStyle: boolean;
  isColor: boolean;
  startColor: ParsedColor | null;
  endColor: ParsedColor | null;
}

/** Read the current value of a property from a target */
export function readProperty(target: AnimatableTarget, property: string): string | number {
  if (isElement(target)) {
    const inline = target.style[property as keyof CSSStyleDeclaration] as string;
    if (inline && inline !== '') return inline;
    const kebab = toKebabCase(property);
    return getComputedStyle(target).getPropertyValue(kebab) || '';
  }
  return (target as Record<string, unknown>)[property] as string | number;
}

/** Write a value to a property on a target */
export function writeProperty(
  target: AnimatableTarget,
  property: string,
  value: string | number,
): void {
  if (isElement(target)) {
    target.style.setProperty(toKebabCase(property), String(value));
  } else {
    (target as Record<string, unknown>)[property] = value;
  }
}

/** Create a property animation descriptor */
export function createPropertyAnimation(
  target: AnimatableTarget,
  property: string,
  endValue: string | number,
  fromValue?: string | number,
): PropertyAnimation {
  const isStyle = isElement(target);
  const endStr = String(endValue);
  const isColor = isStyle && isColorValue(endStr);

  if (isColor) {
    const startStr =
      fromValue !== undefined ? String(fromValue) : String(readProperty(target, property));
    return {
      property,
      startNum: 0,
      endNum: 1,
      unit: '',
      isStyle,
      isColor: true,
      startColor: parseColor(startStr),
      endColor: parseColor(endStr),
    };
  }

  const startRaw = fromValue !== undefined ? fromValue : readProperty(target, property);
  const startNum = parseFloat(String(startRaw)) || 0;
  const endNum = parseFloat(endStr) || 0;

  let unit = '';
  if (typeof startRaw === 'string') {
    const match = startRaw.match(UNIT_RE);
    if (match) unit = match[1]!;
  }
  if (!unit && typeof endValue === 'string') {
    const match = endStr.match(UNIT_RE);
    if (match) unit = match[1]!;
  }

  return {
    property,
    startNum,
    endNum,
    unit,
    isStyle,
    isColor: false,
    startColor: null,
    endColor: null,
  };
}

/** Update a property animation at a given progress (0..1) */
export function updatePropertyAnimation(
  target: AnimatableTarget,
  anim: PropertyAnimation,
  progress: number,
): void {
  if (anim.isColor && anim.startColor && anim.endColor) {
    const color = interpolateColor(anim.startColor, anim.endColor, progress);
    writeProperty(target, anim.property, colorToString(color));
    return;
  }

  const value = anim.startNum + (anim.endNum - anim.startNum) * progress;

  if (anim.isStyle) {
    writeProperty(target, anim.property, value + anim.unit);
  } else {
    writeProperty(target, anim.property, value);
  }
}
