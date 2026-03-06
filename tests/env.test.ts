import { describe, it, expect } from 'vitest';
import { isBrowser, requestFrame, cancelFrame, now } from '../src/env';

describe('env', () => {
  describe('isBrowser', () => {
    it('should return true in jsdom environment', () => {
      expect(isBrowser()).toBe(true);
    });
  });

  describe('requestFrame', () => {
    it('should return a number', () => {
      const id = requestFrame(() => {});
      expect(typeof id).toBe('number');
    });
  });

  describe('cancelFrame', () => {
    it('should not throw when cancelling', () => {
      const id = requestFrame(() => {});
      expect(() => cancelFrame(id)).not.toThrow();
    });

    it('should not throw with id 0', () => {
      expect(() => cancelFrame(0)).not.toThrow();
    });
  });

  describe('now', () => {
    it('should return a non-negative number', () => {
      const time = now();
      expect(typeof time).toBe('number');
      expect(time).toBeGreaterThanOrEqual(0);
    });
  });
});
