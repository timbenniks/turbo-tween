import { describe, it, expect } from 'vite-plus/test';
import { TweenEngine } from '../src/engine';
import { Clock } from '../src/clock';
import { linear } from '../src/easings';

function createTestEngine() {
  const clock = new Clock({ manual: true });
  const engine = new TweenEngine(clock);
  return { engine, clock };
}

describe('Overwrite modes', () => {
  describe('overwrite: "none" (default)', () => {
    it('should not kill existing tweens', () => {
      const { engine, clock } = createTestEngine();
      const target = { value: 0 };

      engine.to(target, 1000, { value: 50, ease: linear });
      engine.to(target, 1000, { value: 100, ease: linear });

      expect(engine.activeCount).toBe(2);

      clock.tick(0);
      clock.tick(1000);
      expect(engine.activeCount).toBe(0);
    });
  });

  describe('overwrite: "all"', () => {
    it('should kill all existing tweens on the same target', () => {
      const { engine } = createTestEngine();
      const target = { value: 0, other: 0 };

      engine.to(target, 1000, { value: 50, ease: linear });
      engine.to(target, 1000, { other: 50, ease: linear });

      expect(engine.activeCount).toBe(2);

      engine.to(target, 500, { value: 100, overwrite: 'all', ease: linear });

      // Both previous tweens killed, one new tween remains
      expect(engine.activeCount).toBe(1);
    });

    it('should not kill tweens on different targets', () => {
      const { engine } = createTestEngine();
      const target1 = { value: 0 };
      const target2 = { value: 0 };

      engine.to(target1, 1000, { value: 50, ease: linear });
      engine.to(target2, 1000, { value: 50, ease: linear });

      engine.to(target1, 500, { value: 100, overwrite: 'all', ease: linear });

      // target1's old tween killed, target2's still alive
      expect(engine.activeCount).toBe(2);
    });
  });

  describe('overwrite: "auto"', () => {
    it('should kill only tweens with overlapping properties', () => {
      const { engine } = createTestEngine();
      const target = { value: 0, other: 0 };

      engine.to(target, 1000, { value: 50, ease: linear });
      engine.to(target, 1000, { other: 50, ease: linear });

      expect(engine.activeCount).toBe(2);

      // This overwrites only 'value', not 'other'
      engine.to(target, 500, { value: 100, overwrite: 'auto', ease: linear });

      // 'value' tween killed, 'other' tween kept, new tween added
      expect(engine.activeCount).toBe(2);
    });

    it('should kill tween when all its properties overlap', () => {
      const { engine } = createTestEngine();
      const target = { value: 0 };

      engine.to(target, 1000, { value: 50, ease: linear });

      engine.to(target, 500, { value: 100, overwrite: 'auto', ease: linear });

      expect(engine.activeCount).toBe(1);
    });
  });
});
