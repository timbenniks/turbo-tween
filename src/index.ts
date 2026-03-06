// Core API
export { Tween, TweenEngine } from './engine';
export { Timeline } from './timeline';
export { stagger } from './stagger';

// Easing functions
export {
  linear,
  quadIn,
  quadOut,
  quadInOut,
  cubicIn,
  cubicOut,
  cubicInOut,
  quartIn,
  quartOut,
  quartInOut,
  quintIn,
  quintOut,
  quintInOut,
  sineIn,
  sineOut,
  sineInOut,
  expoIn,
  expoOut,
  expoInOut,
  circIn,
  circOut,
  circInOut,
  backIn,
  backOut,
  backInOut,
  elasticIn,
  elasticOut,
  elasticInOut,
  bounceIn,
  bounceOut,
  bounceInOut,
} from './easings';

// Types
export type { EasingFunction, TweenOptions, AnimatableTarget, TweenInstance } from './types';
