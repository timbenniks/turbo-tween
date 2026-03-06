// Test setup: deterministic timing for animation tests

let now = 0;

// Mock performance.now for deterministic tests
vi.stubGlobal('performance', {
  now: () => now,
});

// Mock requestAnimationFrame to be manually controllable
const rafCallbacks: FrameRequestCallback[] = [];
let rafId = 0;

vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
  rafCallbacks.push(cb);
  return ++rafId;
});

vi.stubGlobal('cancelAnimationFrame', (_id: number) => {
  // no-op for now
});

/**
 * Advance time and flush RAF callbacks.
 * Use this in tests to simulate animation frames.
 */
export function advanceTime(ms: number): void {
  now += ms;
  const callbacks = rafCallbacks.splice(0);
  for (const cb of callbacks) {
    cb(now);
  }
}

/**
 * Reset time to 0 and clear all pending callbacks.
 */
export function resetTime(): void {
  now = 0;
  rafCallbacks.length = 0;
  rafId = 0;
}

beforeEach(() => {
  resetTime();
});
