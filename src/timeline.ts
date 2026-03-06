import type { AnimatableTarget, TweenInstance, TweenOptions, EasingFunction } from './types';
import { TweenEngine } from './engine';
import { Clock, defaultClock } from './clock';
import { clamp } from './utils';

interface TimelineEntry {
  tween: TweenInstance;
  startTime: number;
  duration: number;
}

export interface TimelineOptions {
  defaults?: {
    duration?: number;
    ease?: EasingFunction;
  };
  /** If true, the timeline auto-plays on creation. Defaults to false. */
  autoPlay?: boolean;
}

/**
 * Timeline sequences multiple tweens with controlled timing.
 * Supports playback control: play, pause, resume, reverse, seek.
 *
 * @example
 * ```ts
 * const tl = new Timeline();
 * tl.to(el, 500, { x: 100 })
 *   .to(el, 500, { y: 200 })
 *   .from(other, 300, { opacity: 0 });
 *
 * tl.play(); // starts playback via RAF
 * await tl;  // wait for completion
 * ```
 */
export class Timeline {
  private entries: TimelineEntry[] = [];
  private engine: TweenEngine;
  private internalClock: Clock;
  private cursor = 0;
  private totalDuration = 0;
  private defaults: TimelineOptions['defaults'];
  private _isPaused = false;
  private _isReversed = false;
  private _progress = 0;
  private currentTimeMs = 0;
  private _isPlaying = false;
  private unsubscribe: (() => void) | null = null;
  private lastTickTime = 0;

  // Promise support
  private resolvePromise: (() => void) | null = null;
  private promise: Promise<void>;

  constructor(options?: TimelineOptions) {
    this.defaults = options?.defaults;
    this.internalClock = new Clock({ manual: true });
    this.engine = new TweenEngine(this.internalClock);

    this.promise = new Promise<void>((resolve) => {
      this.resolvePromise = resolve;
    });

    if (options?.autoPlay) {
      // Defer to allow chaining .to()/.from() before first tick
      queueMicrotask(() => this.play());
    }
  }

  /** Add a to() tween at the current cursor position */
  to(target: AnimatableTarget, duration?: number, options: TweenOptions = {}): Timeline {
    const dur = duration ?? this.defaults?.duration ?? 500;
    const opts = this.mergeDefaults(options);
    const tween = this.engine.to(target, dur, { ...opts, delay: 0 });
    this.addEntry(tween, dur);
    return this;
  }

  /** Add a from() tween at the current cursor position */
  from(target: AnimatableTarget, duration?: number, options: TweenOptions = {}): Timeline {
    const dur = duration ?? this.defaults?.duration ?? 500;
    const opts = this.mergeDefaults(options);
    const tween = this.engine.from(target, dur, { ...opts, delay: 0 });
    this.addEntry(tween, dur);
    return this;
  }

  /** Add a fromTo() tween at the current cursor position */
  fromTo(
    target: AnimatableTarget,
    duration: number,
    fromVars: Record<string, unknown>,
    toVars: TweenOptions = {},
  ): Timeline {
    const opts = this.mergeDefaults(toVars);
    const tween = this.engine.fromTo(target, duration, fromVars, { ...opts, delay: 0 });
    this.addEntry(tween, duration);
    return this;
  }

  /**
   * Add a staggered set of tweens.
   * @param targets - Array of elements/objects to animate
   * @param duration - Duration per tween
   * @param options - Animation options
   * @param staggerFn - Function (index, total) => delayMs from stagger()
   */
  staggerTo(
    targets: AnimatableTarget[],
    duration: number,
    options: TweenOptions = {},
    staggerFn: (index: number, total: number) => number,
  ): Timeline {
    const baseCursor = this.cursor;
    let maxEnd = this.cursor;

    for (let i = 0; i < targets.length; i++) {
      const delay = staggerFn(i, targets.length);
      const opts = this.mergeDefaults(options);
      const tween = this.engine.to(targets[i]!, duration, { ...opts, delay: 0 });
      tween.pause();
      this.entries.push({
        tween,
        startTime: baseCursor + delay,
        duration,
      });
      maxEnd = Math.max(maxEnd, baseCursor + delay + duration);
    }

    this.cursor = maxEnd;
    this.totalDuration = Math.max(this.totalDuration, maxEnd);
    return this;
  }

  private addEntry(tween: TweenInstance, duration: number): void {
    tween.pause();
    this.entries.push({
      tween,
      startTime: this.cursor,
      duration,
    });
    this.cursor += duration;
    this.totalDuration = Math.max(this.totalDuration, this.cursor);
  }

  private mergeDefaults(options: TweenOptions): TweenOptions {
    if (!this.defaults) return options;
    return {
      ease: this.defaults.ease,
      ...options,
    };
  }

  /** Start playing the timeline using RAF */
  play(): Timeline {
    if (this._isPlaying) return this;
    this._isPlaying = true;
    this._isPaused = false;
    this.lastTickTime = 0;

    this.unsubscribe = defaultClock.subscribe((time) => {
      if (this.lastTickTime === 0) {
        this.lastTickTime = time;
        return;
      }
      const delta = time - this.lastTickTime;
      this.lastTickTime = time;
      this.advanceBy(delta);
    });

    return this;
  }

  /** Advance the timeline by deltaMs (for manual/test usage) */
  tick(deltaMs: number): void {
    this.advanceBy(deltaMs);
  }

  private advanceBy(deltaMs: number): void {
    if (this._isPaused) return;

    const direction = this._isReversed ? -1 : 1;
    const newTime = clamp(this.currentTimeMs + deltaMs * direction, 0, this.totalDuration);

    this.seekTo(newTime);

    // Check completion
    if (
      (!this._isReversed && newTime >= this.totalDuration) ||
      (this._isReversed && newTime <= 0)
    ) {
      this.stopPlayback();
      this.resolvePromise?.();
    }
  }

  private seekTo(timeMs: number): void {
    this.currentTimeMs = timeMs;
    this._progress = this.totalDuration === 0 ? 0 : timeMs / this.totalDuration;

    for (const entry of this.entries) {
      const localTime = timeMs - entry.startTime;
      if (localTime >= 0 && localTime <= entry.duration) {
        entry.tween.seek(localTime);
      } else if (localTime > entry.duration) {
        entry.tween.seek(entry.duration);
      } else {
        entry.tween.seek(0);
      }
    }
  }

  private stopPlayback(): void {
    this._isPlaying = false;
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  // -- Playback Control --

  pause(): Timeline {
    this._isPaused = true;
    return this;
  }

  resume(): Timeline {
    this._isPaused = false;
    if (!this._isPlaying) {
      this.play();
    }
    return this;
  }

  reverse(): Timeline {
    this._isReversed = !this._isReversed;
    return this;
  }

  seek(timeMs: number): Timeline {
    this.seekTo(clamp(timeMs, 0, this.totalDuration));
    return this;
  }

  kill(): void {
    this.stopPlayback();
    for (const entry of this.entries) {
      entry.tween.kill();
    }
    this.entries = [];
    this.resolvePromise?.();
  }

  // -- State --

  get progress(): number {
    return this._progress;
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  get isReversed(): boolean {
    return this._isReversed;
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get duration(): number {
    return this.totalDuration;
  }

  // -- Thenable --

  then(resolve: () => void, reject?: (reason?: unknown) => void): Promise<void> {
    return this.promise.then(resolve, reject);
  }
}
