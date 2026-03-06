import { requestFrame, cancelFrame, now } from './env';

export type TickCallback = (elapsed: number) => void;

/**
 * Clock manages the animation loop.
 * - Lazy: starts RAF on first subscriber, stops when none remain.
 * - Manual mode: no RAF, call tick() directly (for tests/SSR).
 */
export class Clock {
  private subscribers = new Set<TickCallback>();
  private rafId = 0;
  private running = false;
  private manual: boolean;
  private lastTime = 0;

  constructor(options?: { manual?: boolean }) {
    this.manual = options?.manual ?? false;
  }

  /** Subscribe to tick updates. Returns an unsubscribe function. */
  subscribe(callback: TickCallback): () => void {
    this.subscribers.add(callback);
    if (!this.manual && !this.running) {
      this.start();
    }
    return () => {
      this.subscribers.delete(callback);
      if (!this.manual && this.subscribers.size === 0) {
        this.stop();
      }
    };
  }

  /** Manually advance time by deltaMs. Only useful in manual mode or tests. */
  tick(deltaMs: number): void {
    this.lastTime += deltaMs;
    this.notify(this.lastTime);
  }

  /** Start the RAF loop */
  private start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = now();
    this.loop();
  }

  /** Stop the RAF loop */
  private stop(): void {
    this.running = false;
    if (this.rafId) {
      cancelFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private loop = (): void => {
    if (!this.running) return;
    this.rafId = requestFrame(this.loop);
    const currentTime = now();
    this.notify(currentTime);
    this.lastTime = currentTime;
  };

  private notify(currentTime: number): void {
    for (const cb of this.subscribers) {
      cb(currentTime);
    }
  }

  /** Whether the clock is currently running */
  get isRunning(): boolean {
    return this.running;
  }

  /** Number of active subscribers */
  get subscriberCount(): number {
    return this.subscribers.size;
  }
}

/** Shared default clock instance (lazy, auto-managed) */
export const defaultClock = new Clock();
