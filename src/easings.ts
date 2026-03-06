import type { EasingFunction } from './types';

const { PI, pow, sin, cos, sqrt } = Math;
const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;
const c4 = (2 * PI) / 3;
const c5 = (2 * PI) / 4.5;

// Linear
export const linear: EasingFunction = (t) => t;

// Quad
export const quadIn: EasingFunction = (t) => t * t;
export const quadOut: EasingFunction = (t) => 1 - (1 - t) * (1 - t);
export const quadInOut: EasingFunction = (t) => (t < 0.5 ? 2 * t * t : 1 - pow(-2 * t + 2, 2) / 2);

// Cubic
export const cubicIn: EasingFunction = (t) => t * t * t;
export const cubicOut: EasingFunction = (t) => 1 - pow(1 - t, 3);
export const cubicInOut: EasingFunction = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2;

// Quart
export const quartIn: EasingFunction = (t) => t * t * t * t;
export const quartOut: EasingFunction = (t) => 1 - pow(1 - t, 4);
export const quartInOut: EasingFunction = (t) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - pow(-2 * t + 2, 4) / 2;

// Quint
export const quintIn: EasingFunction = (t) => t * t * t * t * t;
export const quintOut: EasingFunction = (t) => 1 - pow(1 - t, 5);
export const quintInOut: EasingFunction = (t) =>
  t < 0.5 ? 16 * t * t * t * t * t : 1 - pow(-2 * t + 2, 5) / 2;

// Sine
export const sineIn: EasingFunction = (t) => 1 - cos((t * PI) / 2);
export const sineOut: EasingFunction = (t) => sin((t * PI) / 2);
export const sineInOut: EasingFunction = (t) => -(cos(PI * t) - 1) / 2;

// Expo
export const expoIn: EasingFunction = (t) => (t === 0 ? 0 : pow(2, 10 * t - 10));
export const expoOut: EasingFunction = (t) => (t === 1 ? 1 : 1 - pow(2, -10 * t));
export const expoInOut: EasingFunction = (t) =>
  t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? pow(2, 20 * t - 10) / 2 : (2 - pow(2, -20 * t + 10)) / 2;

// Circ
export const circIn: EasingFunction = (t) => 1 - sqrt(1 - pow(t, 2));
export const circOut: EasingFunction = (t) => sqrt(1 - pow(t - 1, 2));
export const circInOut: EasingFunction = (t) =>
  t < 0.5 ? (1 - sqrt(1 - pow(2 * t, 2))) / 2 : (sqrt(1 - pow(-2 * t + 2, 2)) + 1) / 2;

// Back
export const backIn: EasingFunction = (t) => c3 * t * t * t - c1 * t * t;
export const backOut: EasingFunction = (t) => 1 + c3 * pow(t - 1, 3) + c1 * pow(t - 1, 2);
export const backInOut: EasingFunction = (t) =>
  t < 0.5
    ? (pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
    : (pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;

// Elastic
export const elasticIn: EasingFunction = (t) =>
  t === 0 ? 0 : t === 1 ? 1 : -pow(2, 10 * t - 10) * sin((t * 10 - 10.75) * c4);
export const elasticOut: EasingFunction = (t) =>
  t === 0 ? 0 : t === 1 ? 1 : pow(2, -10 * t) * sin((t * 10 - 0.75) * c4) + 1;
export const elasticInOut: EasingFunction = (t) =>
  t === 0
    ? 0
    : t === 1
      ? 1
      : t < 0.5
        ? -(pow(2, 20 * t - 10) * sin((20 * t - 11.125) * c5)) / 2
        : (pow(2, -20 * t + 10) * sin((20 * t - 11.125) * c5)) / 2 + 1;

// Bounce
function bounceOutFn(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}

export const bounceIn: EasingFunction = (t) => 1 - bounceOutFn(1 - t);
export const bounceOut: EasingFunction = bounceOutFn;
export const bounceInOut: EasingFunction = (t) =>
  t < 0.5 ? (1 - bounceOutFn(1 - 2 * t)) / 2 : (1 + bounceOutFn(2 * t - 1)) / 2;

/** Resolve an easing — accepts a function directly or returns linear as fallback */
export function resolveEasing(ease: EasingFunction | undefined): EasingFunction {
  return ease ?? linear;
}
