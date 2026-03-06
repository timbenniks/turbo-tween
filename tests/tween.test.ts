import { describe, it, expect, vi } from 'vitest';
import { TweenEngine } from '../src/engine';
import { Clock } from '../src/clock';
import { linear } from '../src/easings';

function createTestEngine() {
  const clock = new Clock({ manual: true });
  const engine = new TweenEngine(clock);
  return { engine, clock };
}

describe('Tween playback control', () => {
  describe('pause / resume', () => {
    it('should freeze progress when paused', () => {
      const { engine, clock } = createTestEngine();
      const target = { value: 0 };

      const tween = engine.to(target, 1000, { value: 100, ease: linear });

      clock.tick(0);
      clock.tick(500);
      const valueBefore = target.value;

      tween.pause();
      clock.tick(500);
      expect(target.value).toBe(valueBefore); // frozen
    });

    it('should resume from where it paused', () => {
      const { engine, clock } = createTestEngine();
      const target = { value: 0 };

      const tween = engine.to(target, 1000, { value: 100, ease: linear });

      clock.tick(0);
      clock.tick(500);
      tween.pause();
      clock.tick(200); // time passes while paused
      tween.resume();
      clock.tick(500);

      // Should complete after total 1000ms of active time
      expect(target.value).toBeCloseTo(100, 0);
    });

    it('should not count paused wall time toward progress', () => {
      const { engine, clock } = createTestEngine();
      const target = { value: 0 };

      const tween = engine.to(target, 1000, { value: 100, ease: linear });

      clock.tick(0);
      clock.tick(100);
      tween.pause();
      const pausedValue = target.value;

      // Long pause should not advance progress
      clock.tick(800);
      tween.resume();
      clock.tick(100);

      expect(target.value).toBeGreaterThan(pausedValue);
      expect(target.value).toBeLessThan(30);
    });
  });

  describe('seek', () => {
    it('should jump to a specific time', () => {
      const { engine } = createTestEngine();
      const target = { value: 0 };

      const tween = engine.to(target, 1000, { value: 100, ease: linear });

      tween.seek(750);
      expect(target.value).toBeCloseTo(75, 0);
    });

    it('should clamp seek to duration', () => {
      const { engine } = createTestEngine();
      const target = { value: 0 };

      const tween = engine.to(target, 1000, { value: 100, ease: linear });

      tween.seek(2000);
      expect(target.value).toBeCloseTo(100, 0);
    });
  });

  describe('kill', () => {
    it('should stop the tween and resolve the promise', async () => {
      const { engine, clock } = createTestEngine();
      const target = { value: 0 };

      const tween = engine.to(target, 1000, { value: 100, ease: linear });

      clock.tick(0);
      clock.tick(250);
      tween.kill();

      await tween; // should resolve
      expect(tween.isActive).toBe(false);
    });
  });

  describe('state getters', () => {
    it('should report correct state', () => {
      const { engine, clock } = createTestEngine();
      const target = { value: 0 };

      const tween = engine.to(target, 1000, { value: 100, ease: linear });

      expect(tween.isActive).toBe(true);
      expect(tween.isPaused).toBe(false);
      expect(tween.duration).toBe(1000);

      tween.pause();
      expect(tween.isPaused).toBe(true);

      tween.resume();
      expect(tween.isPaused).toBe(false);

      clock.tick(0);
      clock.tick(1000);
      expect(tween.isActive).toBe(false);
    });
  });
});

describe('Tween from()', () => {
  it('should animate from specified value to current', () => {
    const { engine, clock } = createTestEngine();
    const target = { value: 100 };

    engine.from(target, 1000, { value: 0, ease: linear });

    // At t=0, value should be set to from value
    clock.tick(0);
    clock.tick(0);
    expect(target.value).toBeCloseTo(0, 0);

    clock.tick(500);
    expect(target.value).toBeCloseTo(50, 0);

    clock.tick(500);
    expect(target.value).toBeCloseTo(100, 0);
  });
});

describe('Tween fromTo()', () => {
  it('should animate between explicit start and end', () => {
    const { engine, clock } = createTestEngine();
    const target = { value: 999 }; // current value is irrelevant

    engine.fromTo(target, 1000, { value: 10 }, { value: 90, ease: linear });

    clock.tick(0);
    clock.tick(0);
    expect(target.value).toBeCloseTo(10, 0);

    clock.tick(500);
    expect(target.value).toBeCloseTo(50, 0);

    clock.tick(500);
    expect(target.value).toBeCloseTo(90, 0);
  });
});

describe('Tween reverse()', () => {
  it('should replay a completed tween backwards when reversed', () => {
    const { engine, clock } = createTestEngine();
    const target = { value: 0 };

    const tween = engine.to(target, 1000, { value: 100, ease: linear });

    clock.tick(0);
    clock.tick(1000);
    expect(tween.isActive).toBe(false);
    expect(target.value).toBeCloseTo(100, 0);

    tween.reverse();
    clock.tick(0);
    clock.tick(500);
    expect(target.value).toBeCloseTo(50, 0);

    clock.tick(500);
    expect(target.value).toBeCloseTo(0, 0);
    expect(tween.isActive).toBe(false);
    expect(tween.isReversed).toBe(true);
  });

  it('should toggle isReversed state', () => {
    const { engine } = createTestEngine();
    const target = { value: 0 };

    const tween = engine.to(target, 1000, { value: 100, ease: linear });

    expect(tween.isReversed).toBe(false);
    tween.reverse();
    expect(tween.isReversed).toBe(true);
    tween.reverse();
    expect(tween.isReversed).toBe(false);
  });
});

describe('Tween onStart callback', () => {
  it('should call onStart when the tween begins after delay', () => {
    const { engine, clock } = createTestEngine();
    const target = { value: 0 };
    const onStart = vi.fn();

    engine.to(target, 500, { value: 100, delay: 200, onStart, ease: linear });

    clock.tick(0);
    clock.tick(100);
    expect(onStart).not.toHaveBeenCalled();

    clock.tick(100); // delay over
    clock.tick(1); // first frame after delay
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('should only call onStart once', () => {
    const { engine, clock } = createTestEngine();
    const target = { value: 0 };
    const onStart = vi.fn();

    engine.to(target, 500, { value: 100, onStart, ease: linear });

    clock.tick(0);
    clock.tick(100);
    clock.tick(100);
    clock.tick(100);
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});

describe('Zero-duration tween', () => {
  it('should complete immediately', () => {
    const { engine, clock } = createTestEngine();
    const target = { value: 0 };

    const tween = engine.to(target, 0, { value: 100, ease: linear });

    clock.tick(0);
    clock.tick(0);
    expect(target.value).toBeCloseTo(100, 0);
    expect(tween.isActive).toBe(false);
  });
});

describe('Tween hasTarget via killTweensOf', () => {
  it('should identify the correct target', () => {
    const { engine } = createTestEngine();
    const target1 = { value: 0 };
    const target2 = { value: 0 };

    engine.to(target1, 1000, { value: 100, ease: linear });
    engine.to(target2, 1000, { value: 100, ease: linear });

    engine.killTweensOf(target1);
    expect(engine.activeCount).toBe(1);
  });
});

describe('Tween progress and currentTime', () => {
  it('should report progress correctly', () => {
    const { engine, clock } = createTestEngine();
    const target = { value: 0 };

    const tween = engine.to(target, 1000, { value: 100, ease: linear });

    clock.tick(0);
    clock.tick(500);
    expect(tween.progress).toBeCloseTo(0.5, 1);
    expect(tween.currentTime).toBeCloseTo(500, -1);
  });
});

describe('Tween seek with reverse', () => {
  it('should apply easing in reverse direction when seeking', () => {
    const { engine } = createTestEngine();
    const target = { value: 0 };

    const tween = engine.to(target, 1000, { value: 100, ease: linear });
    tween.reverse();
    tween.seek(250);
    // Reversed: progress = 1 - 0.25 = 0.75
    expect(target.value).toBeCloseTo(75, 0);
  });
});

describe('Tween onReverseComplete', () => {
  it('should call onReverseComplete when reversed tween reaches end', () => {
    const { engine, clock } = createTestEngine();
    const target = { value: 0 };
    const onComplete = vi.fn();
    const onReverseComplete = vi.fn();

    const tween = engine.to(target, 500, {
      value: 100,
      ease: linear,
      onComplete,
      onReverseComplete,
    });

    // Complete forward
    clock.tick(0);
    clock.tick(500);
    expect(onComplete).toHaveBeenCalledTimes(1);

    // Reverse and complete backwards
    tween.reverse();
    clock.tick(0);
    clock.tick(500);
    expect(onReverseComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
