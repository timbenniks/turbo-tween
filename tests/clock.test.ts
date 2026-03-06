import { describe, it, expect, vi } from 'vitest';
import { Clock } from '../src/clock';

describe('Clock', () => {
  describe('manual mode', () => {
    it('should call subscribers on tick', () => {
      const clock = new Clock({ manual: true });
      const callback = vi.fn();

      clock.subscribe(callback);
      clock.tick(16);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should accumulate time across ticks', () => {
      const clock = new Clock({ manual: true });
      const times: number[] = [];

      clock.subscribe((t) => times.push(t));
      clock.tick(16);
      clock.tick(16);
      clock.tick(16);

      expect(times).toEqual([16, 32, 48]);
    });

    it('should support multiple subscribers', () => {
      const clock = new Clock({ manual: true });
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      clock.subscribe(cb1);
      clock.subscribe(cb2);
      clock.tick(16);

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });

    it('should remove subscriber on unsubscribe', () => {
      const clock = new Clock({ manual: true });
      const callback = vi.fn();

      const unsub = clock.subscribe(callback);
      clock.tick(16);
      unsub();
      clock.tick(16);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('isRunning', () => {
    it('should report running state for non-manual clock', () => {
      const clock = new Clock();
      expect(clock.isRunning).toBe(false);

      const unsub = clock.subscribe(() => {});
      expect(clock.isRunning).toBe(true);

      unsub();
      expect(clock.isRunning).toBe(false);
    });

    it('should always be false for manual clock', () => {
      const clock = new Clock({ manual: true });
      expect(clock.isRunning).toBe(false);

      const unsub = clock.subscribe(() => {});
      expect(clock.isRunning).toBe(false);

      unsub();
    });
  });

  describe('subscriber tracking', () => {
    it('should report correct subscriber count', () => {
      const clock = new Clock({ manual: true });
      expect(clock.subscriberCount).toBe(0);

      const unsub1 = clock.subscribe(() => {});
      expect(clock.subscriberCount).toBe(1);

      const unsub2 = clock.subscribe(() => {});
      expect(clock.subscriberCount).toBe(2);

      unsub1();
      expect(clock.subscriberCount).toBe(1);

      unsub2();
      expect(clock.subscriberCount).toBe(0);
    });
  });
});
