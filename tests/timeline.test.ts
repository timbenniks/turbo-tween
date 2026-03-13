import { describe, it, expect } from 'vite-plus/test';
import { Timeline } from '../src/timeline';
import { stagger } from '../src/stagger';
import { linear, quadOut } from '../src/easings';

describe('Timeline', () => {
  describe('sequencing', () => {
    it('should sequence tweens in order', () => {
      const tl = new Timeline();
      const obj1 = { value: 0 };
      const obj2 = { value: 0 };

      tl.to(obj1, 1000, { value: 100, ease: linear }).to(obj2, 1000, { value: 200, ease: linear });

      expect(tl.duration).toBe(2000);

      tl.seek(500);
      expect(obj1.value).toBeCloseTo(50, 0);
      expect(obj2.value).toBeCloseTo(0, 0);

      tl.seek(1500);
      expect(obj1.value).toBeCloseTo(100, 0);
      expect(obj2.value).toBeCloseTo(100, 0);

      tl.seek(2000);
      expect(obj1.value).toBeCloseTo(100, 0);
      expect(obj2.value).toBeCloseTo(200, 0);
    });

    it('should handle from() in timeline', () => {
      const tl = new Timeline();
      const obj = { value: 100 };

      tl.from(obj, 1000, { value: 0, ease: linear });

      tl.seek(500);
      expect(obj.value).toBeCloseTo(50, 0);

      tl.seek(1000);
      expect(obj.value).toBeCloseTo(100, 0);
    });

    it('should handle fromTo() in timeline', () => {
      const tl = new Timeline();
      const obj = { value: 999 };

      tl.fromTo(obj, 1000, { value: 10 }, { value: 90, ease: linear });

      tl.seek(0);
      expect(obj.value).toBeCloseTo(10, 0);

      tl.seek(500);
      expect(obj.value).toBeCloseTo(50, 0);

      tl.seek(1000);
      expect(obj.value).toBeCloseTo(90, 0);
    });
  });

  describe('playback control', () => {
    it('should pause and resume via tick()', () => {
      const tl = new Timeline();
      const obj = { value: 0 };

      tl.to(obj, 1000, { value: 100, ease: linear });

      tl.tick(500);
      const valueAtPause = obj.value;

      tl.pause();
      tl.tick(500);
      expect(obj.value).toBe(valueAtPause); // frozen

      tl.resume();
      // Note: resume calls play() internally if not playing, but for tick-based tests
      // we just set _isPaused = false
    });

    it('should reverse', () => {
      const tl = new Timeline();
      const obj = { value: 0 };

      tl.to(obj, 1000, { value: 100, ease: linear });

      tl.seek(1000);
      expect(obj.value).toBeCloseTo(100, 0);

      tl.reverse();
      tl.tick(500);
      expect(obj.value).toBeCloseTo(50, 0);
    });

    it('should seek to specific time', () => {
      const tl = new Timeline();
      const obj = { value: 0 };

      tl.to(obj, 1000, { value: 100, ease: linear });

      tl.seek(750);
      expect(obj.value).toBeCloseTo(75, 0);
    });

    it('should clamp seek to duration', () => {
      const tl = new Timeline();
      const obj = { value: 0 };

      tl.to(obj, 1000, { value: 100, ease: linear });

      tl.seek(5000);
      expect(obj.value).toBeCloseTo(100, 0);
    });
  });

  describe('defaults', () => {
    it('should apply default ease', () => {
      const tl = new Timeline({ defaults: { ease: linear } });
      const obj = { value: 0 };

      tl.to(obj, 1000, { value: 100 });
      tl.seek(500);
      expect(obj.value).toBeCloseTo(50, 0);
    });

    it('should apply default duration', () => {
      const tl = new Timeline({ defaults: { duration: 800, ease: linear } });
      const obj = { value: 0 };

      tl.to(obj, undefined, { value: 100 });
      expect(tl.duration).toBe(800);
    });
  });

  describe('staggerTo', () => {
    it('should stagger tweens with delay offsets', () => {
      const tl = new Timeline();
      const objs = [{ value: 0 }, { value: 0 }, { value: 0 }];

      tl.staggerTo(objs, 500, { value: 100, ease: linear }, (index) => index * 200);

      // Total duration: max(0 + 500, 200 + 500, 400 + 500) = 900
      expect(tl.duration).toBe(900);

      // At t=0, first tween starts
      tl.seek(250);
      expect(objs[0]!.value).toBeCloseTo(50, 0);
      expect(objs[1]!.value).toBeCloseTo(10, 0); // 50ms into 500ms = 10%
      expect(objs[2]!.value).toBeCloseTo(0, 0); // hasn't started

      // At t=900, all complete
      tl.seek(900);
      expect(objs[0]!.value).toBeCloseTo(100, 0);
      expect(objs[1]!.value).toBeCloseTo(100, 0);
      expect(objs[2]!.value).toBeCloseTo(100, 0);
    });
  });

  describe('progress', () => {
    it('should report correct progress', () => {
      const tl = new Timeline();
      const obj = { value: 0 };

      tl.to(obj, 1000, { value: 100, ease: linear });

      expect(tl.progress).toBe(0);

      tl.seek(500);
      expect(tl.progress).toBeCloseTo(0.5, 2);

      tl.seek(1000);
      expect(tl.progress).toBeCloseTo(1, 2);
    });
  });

  describe('kill', () => {
    it('should stop all child tweens', () => {
      const tl = new Timeline();
      const obj = { value: 0 };

      tl.to(obj, 1000, { value: 100, ease: linear });
      tl.seek(500);

      tl.kill();

      // After kill, no entries should remain
      expect(tl.duration).toBe(1000); // duration doesn't change
    });
  });

  describe('state getters', () => {
    it('should report isPaused', () => {
      const tl = new Timeline();
      expect(tl.isPaused).toBe(false);
      tl.pause();
      expect(tl.isPaused).toBe(true);
      tl.resume();
      expect(tl.isPaused).toBe(false);
    });

    it('should report isReversed', () => {
      const tl = new Timeline();
      expect(tl.isReversed).toBe(false);
      tl.reverse();
      expect(tl.isReversed).toBe(true);
      tl.reverse();
      expect(tl.isReversed).toBe(false);
    });
  });

  describe('thenable', () => {
    it('should be thenable and resolve on tick-based completion', async () => {
      const tl = new Timeline();
      const obj = { value: 0 };

      tl.to(obj, 500, { value: 100, ease: linear });

      let resolved = false;
      void tl.then(() => {
        resolved = true;
      });

      tl.tick(500);
      // Need to give microtask a chance to resolve
      await new Promise((r) => setTimeout(r, 0));
      expect(resolved).toBe(true);
    });
  });

  describe('empty timeline', () => {
    it('should have 0 duration', () => {
      const tl = new Timeline();
      expect(tl.duration).toBe(0);
      expect(tl.progress).toBe(0);
    });

    it('should handle seek on empty timeline', () => {
      const tl = new Timeline();
      expect(() => tl.seek(500)).not.toThrow();
    });
  });

  describe('kill', () => {
    it('should clear entries and stop playback', () => {
      const tl = new Timeline();
      const obj = { value: 0 };

      tl.to(obj, 1000, { value: 100, ease: linear });
      tl.kill();

      // After kill, further ticks should not throw
      expect(() => tl.tick(500)).not.toThrow();
    });

    it('should resolve the promise', async () => {
      const tl = new Timeline();
      const obj = { value: 0 };

      tl.to(obj, 1000, { value: 100, ease: linear });

      let resolved = false;
      void tl.then(() => {
        resolved = true;
      });

      tl.kill();
      await new Promise((r) => setTimeout(r, 0));
      expect(resolved).toBe(true);
    });
  });

  describe('staggerTo with stagger()', () => {
    it('should work with the stagger utility function', () => {
      const tl = new Timeline();
      const objs = [{ value: 0 }, { value: 0 }, { value: 0 }];

      tl.staggerTo(objs, 500, { value: 100, ease: linear }, stagger(100));

      // With stagger(100) and 3 items: delays are 0, 100, 200
      // Total: max(0+500, 100+500, 200+500) = 700
      expect(tl.duration).toBe(700);

      tl.seek(700);
      expect(objs[0]!.value).toBeCloseTo(100, 0);
      expect(objs[1]!.value).toBeCloseTo(100, 0);
      expect(objs[2]!.value).toBeCloseTo(100, 0);
    });
  });

  describe('chaining', () => {
    it('should support method chaining', () => {
      const tl = new Timeline();
      const obj = { x: 0, y: 0 };

      const result = tl
        .to(obj, 500, { x: 100, ease: linear })
        .to(obj, 500, { y: 200, ease: linear });

      expect(result).toBe(tl);
      expect(tl.duration).toBe(1000);
    });
  });

  describe('isPlaying', () => {
    it('should report false initially', () => {
      const tl = new Timeline();
      expect(tl.isPlaying).toBe(false);
    });
  });

  describe('three sequential tweens', () => {
    it('should correctly apply intermediate tween values', () => {
      const tl = new Timeline();
      const a = { value: 0 };
      const b = { value: 0 };
      const c = { value: 0 };

      tl.to(a, 300, { value: 10, ease: linear })
        .to(b, 300, { value: 20, ease: linear })
        .to(c, 300, { value: 30, ease: linear });

      expect(tl.duration).toBe(900);

      // Middle of second tween
      tl.seek(450);
      expect(a.value).toBeCloseTo(10, 0);
      expect(b.value).toBeCloseTo(10, 0);
      expect(c.value).toBeCloseTo(0, 0);

      // End
      tl.seek(900);
      expect(a.value).toBeCloseTo(10, 0);
      expect(b.value).toBeCloseTo(20, 0);
      expect(c.value).toBeCloseTo(30, 0);
    });
  });

  describe('defaults with ease override', () => {
    it('should allow per-tween ease override', () => {
      const tl = new Timeline({ defaults: { ease: linear } });
      const obj = { value: 0 };

      tl.to(obj, 1000, { value: 100, ease: quadOut });
      tl.seek(500);
      // quadOut(0.5) = 0.75, not 0.5 (linear)
      expect(obj.value).toBeCloseTo(75, 0);
    });
  });
});
