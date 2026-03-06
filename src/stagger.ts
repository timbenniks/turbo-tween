import type { EasingFunction } from './types';
import { linear } from './easings';

export interface StaggerConfig {
  /** Start stagger from a specific position */
  from?: 'start' | 'center' | 'end' | number;
  /** Easing to apply to stagger distribution */
  ease?: EasingFunction;
}

/**
 * Create a stagger function that returns per-element delay values.
 *
 * @param amount - Delay between each element (ms), or total spread if used with `from`
 * @param config - Optional stagger configuration
 * @returns A function (index, total) => delayMs
 *
 * @example
 * ```ts
 * // Simple: 100ms between each element
 * stagger(100)
 *
 * // From center
 * stagger(100, { from: 'center' })
 * ```
 */
export function stagger(
  amount: number,
  config?: StaggerConfig,
): (index: number, total: number) => number {
  const ease = config?.ease ?? linear;
  const from = config?.from ?? 'start';

  return (index: number, total: number): number => {
    if (total <= 1) return 0;

    let position: number;

    if (from === 'start') {
      position = index / (total - 1);
    } else if (from === 'end') {
      position = (total - 1 - index) / (total - 1);
    } else if (from === 'center') {
      const center = (total - 1) / 2;
      position = Math.abs(index - center) / center;
    } else {
      // Numeric: distance from specified index
      const maxDist = Math.max(from, total - 1 - from);
      position = maxDist === 0 ? 0 : Math.abs(index - from) / maxDist;
    }

    return ease(position) * amount * (total - 1);
  };
}
