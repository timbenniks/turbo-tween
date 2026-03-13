import type { AnimatableTarget, TweenInstance, TweenOptions } from './types';
import { isBrowser } from './env';
import { Clock, defaultClock } from './clock';
import { TweenCore } from './tween';

/**
 * TweenEngine manages active tweens and drives them via a Clock.
 * Can be instantiated for isolation, or use the default singleton via `Tween`.
 */
export class TweenEngine {
  private activeTweens: TweenCore[] = [];
  private clock: Clock;
  private unsubscribe: (() => void) | null = null;

  constructor(clock?: Clock) {
    this.clock = clock ?? defaultClock;
  }

  private ensureRunning(): void {
    if (this.unsubscribe) return;
    this.unsubscribe = this.clock.subscribe((time) => this.tick(time));
  }

  private checkIdle(): void {
    if (this.activeTweens.length === 0 && this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  private tick(currentTime: number): void {
    for (let i = this.activeTweens.length - 1; i >= 0; i--) {
      const tween = this.activeTweens[i]!;
      tween.tick(currentTime);
      if (tween.completed) {
        this.activeTweens.splice(i, 1);
      }
    }
    this.checkIdle();
  }

  private addTween(tween: TweenCore, overwrite?: 'auto' | 'all' | 'none'): TweenInstance {
    const mode = overwrite ?? 'none';

    if (mode !== 'none') {
      this.applyOverwrite(tween, mode);
    }

    tween.onKill = () => {
      const idx = this.activeTweens.indexOf(tween);
      if (idx !== -1) {
        this.activeTweens.splice(idx, 1);
        this.checkIdle();
      }
    };
    tween.onRevive = () => {
      if (this.activeTweens.includes(tween)) return;
      this.activeTweens.push(tween);
      this.ensureRunning();
    };
    this.activeTweens.push(tween);
    this.ensureRunning();
    return tween;
  }

  private applyOverwrite(incoming: TweenCore, mode: 'auto' | 'all'): void {
    const target = incoming.getTarget();
    const incomingKeys = mode === 'auto' ? incoming.getAnimatedKeys() : null;

    for (let i = this.activeTweens.length - 1; i >= 0; i--) {
      const existing = this.activeTweens[i]!;
      if (!existing.hasTarget(target)) continue;

      if (mode === 'all') {
        existing.kill();
      } else if (incomingKeys) {
        // Auto mode: kill only if there are overlapping properties
        const existingKeys = existing.getAnimatedKeys();
        for (const key of incomingKeys) {
          if (existingKeys.has(key)) {
            existing.kill();
            break;
          }
        }
      }
    }
  }

  /**
   * Animate properties to target values.
   * @param target - Element or object to animate
   * @param duration - Duration in milliseconds
   * @param options - Properties to animate + configuration
   */
  to(target: AnimatableTarget, duration: number, options: TweenOptions = {}): TweenInstance {
    if (!isBrowser()) {
      // SSR no-op: return a dummy that resolves immediately
      return this.createNoopTween();
    }
    const tween = new TweenCore({ target, duration, options, mode: 'to' });
    return this.addTween(tween, options.overwrite);
  }

  /**
   * Animate properties from specified values to current values.
   * @param target - Element or object to animate
   * @param duration - Duration in milliseconds
   * @param options - Starting values + configuration
   */
  from(target: AnimatableTarget, duration: number, options: TweenOptions = {}): TweenInstance {
    if (!isBrowser()) {
      return this.createNoopTween();
    }
    const tween = new TweenCore({ target, duration, options, mode: 'from' });
    return this.addTween(tween, options.overwrite);
  }

  /**
   * Animate properties from explicit start values to explicit end values.
   * @param target - Element or object to animate
   * @param duration - Duration in milliseconds
   * @param fromVars - Starting values
   * @param toVars - Ending values + configuration
   */
  fromTo(
    target: AnimatableTarget,
    duration: number,
    fromVars: Record<string, unknown>,
    toVars: TweenOptions = {},
  ): TweenInstance {
    if (!isBrowser()) {
      return this.createNoopTween();
    }
    const tween = new TweenCore({
      target,
      duration,
      options: toVars,
      mode: 'fromTo',
      fromOptions: fromVars,
    });
    return this.addTween(tween, toVars.overwrite);
  }

  /** Kill all active tweens */
  killAll(): void {
    while (this.activeTweens.length > 0) {
      this.activeTweens[this.activeTweens.length - 1]!.kill();
    }
    this.checkIdle();
  }

  /** Kill all tweens targeting a specific object */
  killTweensOf(target: AnimatableTarget): void {
    for (let i = this.activeTweens.length - 1; i >= 0; i--) {
      if (this.activeTweens[i]!.hasTarget(target)) {
        this.activeTweens[i]!.kill();
      }
    }
  }

  /** Number of active tweens */
  get activeCount(): number {
    return this.activeTweens.length;
  }

  /** Create a no-op tween for SSR */
  private createNoopTween(): TweenInstance {
    return {
      pause: function () {
        return this;
      },
      resume: function () {
        return this;
      },
      reverse: function () {
        return this;
      },
      seek: function () {
        return this;
      },
      kill: () => {},
      progress: 0,
      isActive: false,
      isPaused: false,
      isReversed: false,
      duration: 0,
      currentTime: 0,
      completed: true,
      then: (resolve) => Promise.resolve().then(resolve),
    };
  }
}

/** Default engine singleton */
const defaultEngine = new TweenEngine();

/**
 * Main public API — uses the default engine singleton.
 *
 * @example
 * ```ts
 * import { Tween, quadOut } from 'turbo-tween';
 *
 * const t = Tween.to(element, 1000, { x: 100, opacity: 0.5, ease: quadOut });
 * await t; // wait for completion
 * ```
 */
export const Tween = {
  to: defaultEngine.to.bind(defaultEngine),
  from: defaultEngine.from.bind(defaultEngine),
  fromTo: defaultEngine.fromTo.bind(defaultEngine),
  killAll: defaultEngine.killAll.bind(defaultEngine),
  killTweensOf: defaultEngine.killTweensOf.bind(defaultEngine),
};
