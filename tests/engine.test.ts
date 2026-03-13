import { describe, it, expect, vi } from 'vite-plus/test';
import { TweenEngine } from '../src/engine';
import { Clock } from '../src/clock';
import { linear, quadOut } from '../src/easings';

function createTestEngine() {
  const clock = new Clock({ manual: true });
  const engine = new TweenEngine(clock);
  return { engine, clock };
}

describe('TweenEngine', () => {
  describe('to()', () => {
    it('should animate a plain object property', () => {
      const { engine, clock } = createTestEngine();
      const target = { value: 0 };

      engine.to(target, 1000, { value: 100, ease: linear });

      clock.tick(0); // first tick initializes
      clock.tick(500);
      expect(target.value).toBeCloseTo(50, 0);

      clock.tick(500);
      expect(target.value).toBeCloseTo(100, 0);
    });

    it('should apply easing', () => {
      const { engine, clock } = createTestEngine();
      const target = { value: 0 };

      engine.to(target, 1000, { value: 100, ease: quadOut });

      clock.tick(0);
      clock.tick(500);
      // quadOut at 0.5 = 0.75
      expect(target.value).toBeCloseTo(75, 0);
    });

    it('should handle delay', () => {
      const { engine, clock } = createTestEngine();
      const target = { value: 0 };

      engine.to(target, 1000, { value: 100, delay: 200, ease: linear });

      clock.tick(0);
      clock.tick(100);
      expect(target.value).toBe(0); // still in delay

      clock.tick(100); // delay over, tween starts
      clock.tick(500);
      expect(target.value).toBeCloseTo(50, 0);
    });

    it('should call onComplete when finished', () => {
      const { engine, clock } = createTestEngine();
      const target = { value: 0 };
      const onComplete = vi.fn();

      engine.to(target, 500, { value: 100, onComplete, ease: linear });

      clock.tick(0);
      clock.tick(250);
      expect(onComplete).not.toHaveBeenCalled();

      clock.tick(250);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should call onUpdate with progress', () => {
      const { engine, clock } = createTestEngine();
      const target = { value: 0 };
      const updates: number[] = [];

      engine.to(target, 1000, {
        value: 100,
        ease: linear,
        onUpdate: (p) => updates.push(p),
      });

      clock.tick(0);
      clock.tick(500);
      clock.tick(500);

      expect(updates.length).toBeGreaterThan(0);
      expect(updates[updates.length - 1]).toBeCloseTo(1, 1);
    });

    it('should be thenable (awaitable)', async () => {
      const { engine, clock } = createTestEngine();
      const target = { value: 0 };

      const tween = engine.to(target, 100, { value: 50, ease: linear });

      clock.tick(0);
      clock.tick(100);

      await tween;
      expect(target.value).toBeCloseTo(50, 0);
    });
  });

  describe('killAll()', () => {
    it('should stop all active tweens', () => {
      const { engine, clock } = createTestEngine();
      const t1 = { value: 0 };
      const t2 = { value: 0 };

      engine.to(t1, 1000, { value: 100, ease: linear });
      engine.to(t2, 1000, { value: 100, ease: linear });

      clock.tick(0);
      clock.tick(500);
      engine.killAll();
      const v1 = t1.value;
      const v2 = t2.value;

      clock.tick(500);
      // Values should not have changed after kill
      expect(t1.value).toBe(v1);
      expect(t2.value).toBe(v2);
    });
  });

  describe('killTweensOf()', () => {
    it('should kill tweens for a specific target', () => {
      const { engine, clock } = createTestEngine();
      const t1 = { value: 0 };
      const t2 = { value: 0 };

      engine.to(t1, 1000, { value: 100, ease: linear });
      engine.to(t2, 1000, { value: 100, ease: linear });

      clock.tick(0);
      clock.tick(500);
      engine.killTweensOf(t1);
      const v1 = t1.value;

      clock.tick(500);
      expect(t1.value).toBe(v1); // t1 stopped
      expect(t2.value).toBeCloseTo(100, 0); // t2 continued
    });
  });

  describe('activeCount', () => {
    it('should track active tween count', () => {
      const { engine } = createTestEngine();

      expect(engine.activeCount).toBe(0);
      engine.to({ value: 0 }, 1000, { value: 100, ease: linear });
      expect(engine.activeCount).toBe(1);

      engine.to({ value: 0 }, 1000, { value: 100, ease: linear });
      expect(engine.activeCount).toBe(2);

      engine.killAll();
      expect(engine.activeCount).toBe(0);
    });
  });

  describe('from()', () => {
    it('should animate from specified value to current', () => {
      const { engine, clock } = createTestEngine();
      const target = { value: 100 };

      engine.from(target, 1000, { value: 0, ease: linear });

      clock.tick(0);
      clock.tick(0);
      expect(target.value).toBeCloseTo(0, 0);

      clock.tick(1000);
      expect(target.value).toBeCloseTo(100, 0);
    });

    it('should set the starting value immediately', () => {
      const { engine } = createTestEngine();
      const target = { value: 100 };

      engine.from(target, 1000, { value: 0, ease: linear });
      expect(target.value).toBeCloseTo(0, 0);
    });
  });

  describe('fromTo()', () => {
    it('should animate between explicit start and end values', () => {
      const { engine, clock } = createTestEngine();
      const target = { value: 999 };

      engine.fromTo(target, 1000, { value: 10 }, { value: 90, ease: linear });

      clock.tick(0);
      clock.tick(500);
      expect(target.value).toBeCloseTo(50, 0);

      clock.tick(500);
      expect(target.value).toBeCloseTo(90, 0);
    });

    it('should handle multiple properties', () => {
      const { engine, clock } = createTestEngine();
      const target = { posX: 0, posY: 0 };

      engine.fromTo(
        target,
        1000,
        { posX: -100, posY: -200 },
        { posX: 100, posY: 200, ease: linear },
      );

      clock.tick(0);
      clock.tick(500);
      expect(target.posX).toBeCloseTo(0, 0);
      expect(target.posY).toBeCloseTo(0, 0);

      clock.tick(500);
      expect(target.posX).toBeCloseTo(100, 0);
      expect(target.posY).toBeCloseTo(200, 0);
    });
  });

  describe('tween removal on completion', () => {
    it('should remove completed tweens from active list', () => {
      const { engine, clock } = createTestEngine();

      engine.to({ value: 0 }, 500, { value: 100, ease: linear });
      engine.to({ value: 0 }, 1000, { value: 100, ease: linear });

      expect(engine.activeCount).toBe(2);

      clock.tick(0);
      clock.tick(500);
      expect(engine.activeCount).toBe(1);

      clock.tick(500);
      expect(engine.activeCount).toBe(0);
    });
  });

  describe('multiple properties on same target', () => {
    it('should animate multiple properties simultaneously', () => {
      const { engine, clock } = createTestEngine();
      const target = { a: 0, b: 0, c: 0 };

      engine.to(target, 1000, { a: 100, b: 200, c: 300, ease: linear });

      clock.tick(0);
      clock.tick(500);
      expect(target.a).toBeCloseTo(50, 0);
      expect(target.b).toBeCloseTo(100, 0);
      expect(target.c).toBeCloseTo(150, 0);
    });
  });
});
