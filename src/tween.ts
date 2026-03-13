import type {
  AnimatableTarget,
  EasingFunction,
  TweenInstance,
  TweenOptions,
  TransformShorthand,
} from './types';
import { RESERVED_KEYS } from './types';
import { clamp, isElement } from './utils';
import { resolveEasing } from './easings';
import { isBrowser } from './env';
import {
  createPropertyAnimation,
  updatePropertyAnimation,
  type PropertyAnimation,
} from './interpolate';
import {
  isTransformShorthand,
  getTransformState,
  getTransformValue,
  setTransformValue,
  composeTransform,
} from './transform-map';

export type TweenMode = 'to' | 'from' | 'fromTo';

export interface TweenConfig {
  target: AnimatableTarget;
  duration: number;
  options: TweenOptions;
  mode: TweenMode;
  fromOptions?: Record<string, unknown>;
}

function toAnimatableValue(value: unknown): string | number | null {
  return typeof value === 'string' || typeof value === 'number' ? value : null;
}

/**
 * Core Tween implementation with full playback control.
 * Implements TweenInstance interface + thenable for await support.
 */
export class TweenCore implements TweenInstance {
  private target: AnimatableTarget;
  private durationMs: number;
  private delayMs: number;
  private ease: EasingFunction;
  private mode: TweenMode;
  private fromVars: Record<string, unknown> | undefined;

  // Callbacks
  private onStartCb: (() => void) | null;
  private onUpdateCb: ((progress: number) => void) | null;
  private onCompleteCb: (() => void) | null;
  private onReverseCompleteCb: (() => void) | null;

  // Property animations
  private animations: PropertyAnimation[] = [];
  private transformProps: Array<{
    shorthand: TransformShorthand;
    startValue: number;
    endValue: number;
  }> = [];
  private hasTransforms = false;

  // Playback state
  private _progress = 0;
  private _isActive = false;
  private _isPaused = false;
  private _isReversed = false;
  private _isStarted = false;
  private _isComplete = false;
  private _isTimeInitialized = false;
  private startTime = 0;
  private pauseTime = 0;
  private needsStartTimeAdjustment = false;
  private elapsed = 0;

  // Promise support
  private resolvePromise: (() => void) | null = null;
  private rejectPromise: ((reason?: unknown) => void) | null = null;
  private promise: Promise<void>;

  // Engine callback to remove self
  public onKill: (() => void) | null = null;
  public onRevive: (() => void) | null = null;

  constructor(config: TweenConfig) {
    this.target = config.target;
    this.durationMs = config.duration;
    this.mode = config.mode;
    this.fromVars = config.fromOptions;

    const opts = config.options;
    this.delayMs = opts.delay ?? 0;
    this.ease = resolveEasing(opts.ease);
    this.onStartCb = opts.onStart ?? null;
    this.onUpdateCb = opts.onUpdate ?? null;
    this.onCompleteCb = opts.onComplete ?? null;
    this.onReverseCompleteCb = opts.onReverseComplete ?? null;

    this._isActive = true;

    // Parse animatable properties from options
    this.parseProperties(opts);

    // Create the promise
    this.promise = new Promise<void>((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;
    });
  }

  private parseProperties(opts: TweenOptions): void {
    if (!isBrowser() && isElement(this.target)) return;

    for (const [key, value] of Object.entries(opts)) {
      if (RESERVED_KEYS.has(key)) continue;
      if (value === undefined || value === null) continue;

      if (isTransformShorthand(key)) {
        const endTransformValue = toAnimatableValue(value);
        if (endTransformValue === null) continue;

        this.hasTransforms = true;
        const endValue =
          typeof endTransformValue === 'number' ? endTransformValue : parseFloat(endTransformValue);
        let startValue: number;

        if (this.mode === 'fromTo' && this.fromVars && key in this.fromVars) {
          const fromTransformValue = toAnimatableValue(this.fromVars[key]);
          startValue =
            typeof fromTransformValue === 'number'
              ? fromTransformValue
              : parseFloat(fromTransformValue ?? '0');
        } else if (this.mode === 'from') {
          // 'from' mode: value is the start, current state is the end
          const state = isElement(this.target) ? getTransformState(this.target) : null;
          startValue = endValue;
          const currentVal = state ? getTransformValue(state, key) : 0;
          this.transformProps.push({ shorthand: key, startValue, endValue: currentVal });
          continue;
        } else {
          const state = isElement(this.target) ? getTransformState(this.target) : null;
          startValue = state ? getTransformValue(state, key) : 0;
        }

        this.transformProps.push({ shorthand: key, startValue, endValue });
      } else if (typeof value === 'string' || typeof value === 'number') {
        const fromVal =
          this.mode === 'fromTo' && this.fromVars && key in this.fromVars
            ? (this.fromVars[key] as string | number)
            : this.mode === 'from'
              ? value
              : undefined;

        if (this.mode === 'from') {
          // 'from' mode: value is the starting point, animate to current
          const currentValue = isElement(this.target)
            ? getComputedStyle(this.target).getPropertyValue(key) || '0'
            : (toAnimatableValue((this.target as Record<string, unknown>)[key]) ?? 0);
          const anim = createPropertyAnimation(this.target, key, currentValue, value);
          this.animations.push(anim);
        } else {
          const anim = createPropertyAnimation(this.target, key, value, fromVal);
          this.animations.push(anim);
        }
      }
    }

    // If in 'from' mode, immediately set the starting values
    if (this.mode === 'from') {
      this.applyAtProgress(0);
    }
  }

  /** Called by the engine on each tick with the current timestamp */
  public tick(currentTime: number): void {
    if (!this._isActive || this._isComplete) return;

    // Initialize start time on very first tick
    if (!this._isTimeInitialized) {
      this._isTimeInitialized = true;
      this.startTime = currentTime + this.delayMs;
    }

    if (this._isPaused) {
      const elapsedWhilePaused = currentTime - this.startTime;
      if (this.pauseTime === 0 && elapsedWhilePaused < 0) {
        this.pauseTime = elapsedWhilePaused;
      }
      // Keep active elapsed time frozen while paused.
      this.startTime = currentTime - this.pauseTime;
      return;
    }

    if (this.needsStartTimeAdjustment) {
      this.startTime = currentTime - this.pauseTime;
      this.needsStartTimeAdjustment = false;
    }

    const elapsed = currentTime - this.startTime;

    // Still in delay phase
    if (elapsed < 0) {
      this.elapsed = elapsed;
      return;
    }

    // Fire onStart on first real update
    if (!this._isStarted) {
      this._isStarted = true;
      this.onStartCb?.();
    }

    this.elapsed = elapsed;

    // Calculate raw progress
    let rawProgress = this.durationMs === 0 ? 1 : clamp(elapsed / this.durationMs, 0, 1);

    // Apply direction
    if (this._isReversed) {
      rawProgress = 1 - rawProgress;
    }

    // Apply easing
    this._progress = this.ease(rawProgress);

    // Update all properties
    this.applyAtProgress(this._progress);

    // Fire update callback
    this.onUpdateCb?.(this._progress);

    // Check completion
    if (elapsed >= this.durationMs) {
      this._isComplete = true;
      this._isActive = false;

      if (this._isReversed) {
        this.onReverseCompleteCb?.();
      } else {
        this.onCompleteCb?.();
      }
      this.resolvePromise?.();
    }
  }

  private applyAtProgress(progress: number): void {
    // Update regular properties
    for (const anim of this.animations) {
      updatePropertyAnimation(this.target, anim, progress);
    }

    // Update transform shorthands
    if (this.hasTransforms && isElement(this.target)) {
      const state = getTransformState(this.target);
      for (const tp of this.transformProps) {
        const value = tp.startValue + (tp.endValue - tp.startValue) * progress;
        setTransformValue(state, tp.shorthand, value);
      }
      this.target.style.transform = composeTransform(state);
    }
  }

  // -- Playback Control --

  pause(): TweenInstance {
    if (!this._isPaused && this._isActive) {
      this._isPaused = true;
      this.pauseTime = this.elapsed;
    }
    return this;
  }

  resume(): TweenInstance {
    if (this._isPaused && this._isActive) {
      this._isPaused = false;
    }
    return this;
  }

  reverse(): TweenInstance {
    this._isReversed = !this._isReversed;
    if (this._isComplete) {
      this._isComplete = false;
      this._isActive = true;
      this.elapsed = 0;
      this.pauseTime = 0;
      this._isStarted = false;
      this.needsStartTimeAdjustment = true;
      this.onRevive?.();
    }
    return this;
  }

  seek(timeMs: number): TweenInstance {
    const rawProgress = this.durationMs === 0 ? 1 : clamp(timeMs / this.durationMs, 0, 1);
    const easedProgress = this._isReversed ? this.ease(1 - rawProgress) : this.ease(rawProgress);

    this._progress = easedProgress;
    this.elapsed = timeMs;
    this.applyAtProgress(this._progress);
    this.onUpdateCb?.(this._progress);

    return this;
  }

  kill(): void {
    this._isActive = false;
    this._isComplete = true;
    this.onKill?.();
    this.resolvePromise?.();
  }

  // -- Readonly State --

  get progress(): number {
    return this._progress;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  get isReversed(): boolean {
    return this._isReversed;
  }

  get duration(): number {
    return this.durationMs;
  }

  get currentTime(): number {
    return this.elapsed;
  }

  get completed(): boolean {
    return this._isComplete;
  }

  // -- Thenable --

  then(resolve: () => void, reject?: (reason?: unknown) => void): Promise<void> {
    return this.promise.then(resolve, reject);
  }

  /** Check if this tween targets the specified object */
  hasTarget(target: AnimatableTarget): boolean {
    return this.target === target;
  }

  /** Get the target of this tween */
  getTarget(): AnimatableTarget {
    return this.target;
  }

  /** Get the set of property keys this tween animates */
  getAnimatedKeys(): Set<string> {
    const keys = new Set<string>();
    for (const anim of this.animations) {
      keys.add(anim.property);
    }
    for (const tp of this.transformProps) {
      keys.add(tp.shorthand);
    }
    return keys;
  }
}
