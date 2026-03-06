/** A normalized easing function: input 0..1, output typically 0..1 (may overshoot for elastic/back) */
export type EasingFunction = (t: number) => number;

/** Any target that can be animated: DOM element, plain object, or object with style */
export type AnimatableTarget =
  | HTMLElement
  | Record<string, unknown>
  | { style?: CSSStyleDeclaration };

/** Options for creating a tween */
export interface TweenOptions {
  /** Delay before the tween starts (ms) */
  delay?: number;
  /** Easing function */
  ease?: EasingFunction;
  /** Overwrite mode for conflicting tweens on the same target */
  overwrite?: 'auto' | 'all' | 'none';
  /** Called when the tween starts (after delay) */
  onStart?: () => void;
  /** Called on each frame update */
  onUpdate?: (progress: number) => void;
  /** Called when the tween completes */
  onComplete?: () => void;
  /** Called when a reversed tween reaches the beginning */
  onReverseComplete?: () => void;
  /** Properties to animate (property name -> target value) */
  [key: string]: unknown;
}

/** Public interface for a tween instance */
export interface TweenInstance {
  pause(): TweenInstance;
  resume(): TweenInstance;
  reverse(): TweenInstance;
  seek(timeMs: number): TweenInstance;
  kill(): void;

  readonly progress: number;
  readonly isActive: boolean;
  readonly isPaused: boolean;
  readonly isReversed: boolean;
  readonly duration: number;
  readonly currentTime: number;
  readonly completed: boolean;

  then(resolve: () => void, reject?: (reason?: unknown) => void): Promise<void>;
}

/** Transform shorthand property names */
export type TransformShorthand =
  | 'x'
  | 'y'
  | 'z'
  | 'scale'
  | 'scaleX'
  | 'scaleY'
  | 'scaleZ'
  | 'rotation'
  | 'rotationX'
  | 'rotationY'
  | 'rotationZ'
  | 'skewX'
  | 'skewY';

/** Internal parsed color representation */
export interface ParsedColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Reserved option keys that should not be treated as animatable properties */
export const RESERVED_KEYS = new Set([
  'delay',
  'ease',
  'overwrite',
  'onStart',
  'onUpdate',
  'onComplete',
  'onReverseComplete',
]);
