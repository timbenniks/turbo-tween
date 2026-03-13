import { describe, it, expect } from 'vite-plus/test';
import {
  linear,
  quadIn,
  quadOut,
  quadInOut,
  cubicIn,
  cubicOut,
  cubicInOut,
  quartIn,
  quartOut,
  quartInOut,
  quintIn,
  quintOut,
  quintInOut,
  sineIn,
  sineOut,
  sineInOut,
  expoIn,
  expoOut,
  expoInOut,
  circIn,
  circOut,
  circInOut,
  backIn,
  backOut,
  backInOut,
  elasticIn,
  elasticOut,
  elasticInOut,
  bounceIn,
  bounceOut,
  bounceInOut,
} from '../src/easings';

const allEasings = {
  linear,
  quadIn,
  quadOut,
  quadInOut,
  cubicIn,
  cubicOut,
  cubicInOut,
  quartIn,
  quartOut,
  quartInOut,
  quintIn,
  quintOut,
  quintInOut,
  sineIn,
  sineOut,
  sineInOut,
  expoIn,
  expoOut,
  expoInOut,
  circIn,
  circOut,
  circInOut,
  backIn,
  backOut,
  backInOut,
  elasticIn,
  elasticOut,
  elasticInOut,
  bounceIn,
  bounceOut,
  bounceInOut,
};

describe('Easings', () => {
  for (const [name, fn] of Object.entries(allEasings)) {
    describe(name, () => {
      it('should return 0 at t=0', () => {
        expect(fn(0)).toBeCloseTo(0, 5);
      });

      it('should return 1 at t=1', () => {
        expect(fn(1)).toBeCloseTo(1, 5);
      });

      it('should return a number for t=0.5', () => {
        const result = fn(0.5);
        expect(typeof result).toBe('number');
        expect(isNaN(result)).toBe(false);
      });
    });
  }

  it('linear should return the input unchanged', () => {
    for (let t = 0; t <= 1; t += 0.1) {
      expect(linear(t)).toBeCloseTo(t, 10);
    }
  });

  it('quadIn should be slower at the start', () => {
    expect(quadIn(0.25)).toBeLessThan(0.25);
    expect(quadIn(0.5)).toBeLessThan(0.5);
  });

  it('quadOut should be faster at the start', () => {
    expect(quadOut(0.25)).toBeGreaterThan(0.25);
    expect(quadOut(0.5)).toBeGreaterThan(0.5);
  });

  it('back easings should overshoot', () => {
    // backIn goes negative near the start
    expect(backIn(0.1)).toBeLessThan(0);
    // backOut goes above 1 near the end
    expect(backOut(0.9)).toBeGreaterThan(1);
  });

  it('elastic easings should oscillate', () => {
    // elasticOut oscillates above 1
    const values = [0.2, 0.4, 0.6, 0.8].map((t) => elasticOut(t));
    const hasOscillation = values.some((v) => v > 1) || values.some((v) => v < 0);
    expect(hasOscillation).toBe(true);
  });

  it('bounce easings should stay in [0, 1] range', () => {
    for (let t = 0; t <= 1; t += 0.05) {
      expect(bounceOut(t)).toBeGreaterThanOrEqual(0);
      expect(bounceOut(t)).toBeLessThanOrEqual(1);
    }
  });

  it('expoInOut should handle t < 0.5 branch', () => {
    const result = expoInOut(0.25);
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(0.5);
  });

  it('elasticInOut should handle t < 0.5 branch', () => {
    const result = elasticInOut(0.25);
    expect(typeof result).toBe('number');
    expect(isNaN(result)).toBe(false);
  });
});
