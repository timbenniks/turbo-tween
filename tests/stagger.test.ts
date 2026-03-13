import { describe, it, expect } from 'vite-plus/test';
import { stagger } from '../src/stagger';
import { quadIn } from '../src/easings';

describe('stagger', () => {
  it('should produce linear delays from start', () => {
    const fn = stagger(100);
    expect(fn(0, 5)).toBe(0);
    expect(fn(1, 5)).toBe(100);
    expect(fn(2, 5)).toBe(200);
    expect(fn(3, 5)).toBe(300);
    expect(fn(4, 5)).toBe(400);
  });

  it('should produce delays from end', () => {
    const fn = stagger(100, { from: 'end' });
    expect(fn(0, 5)).toBe(400);
    expect(fn(4, 5)).toBe(0);
  });

  it('should produce delays from center', () => {
    const fn = stagger(100, { from: 'center' });
    // Center of 5 items is index 2
    expect(fn(2, 5)).toBe(0); // center element has 0 delay
    expect(fn(0, 5)).toBe(fn(4, 5)); // symmetric
  });

  it('should return 0 for single element', () => {
    const fn = stagger(100);
    expect(fn(0, 1)).toBe(0);
  });

  it('should produce delays from a numeric index', () => {
    const fn = stagger(100, { from: 1 });
    // 5 elements, radiating from index 1
    // maxDist = max(1, 3) = 3
    // index 1: distance 0, delay 0
    expect(fn(1, 5)).toBe(0);
    // index 0: distance 1/3
    expect(fn(0, 5)).toBeGreaterThan(0);
    // index 4: distance 3/3 = 1, so max delay
    expect(fn(4, 5)).toBeCloseTo(100 * 4, 0); // position=1, ease(1)*amount*(total-1)
  });

  it('should apply ease to stagger distribution', () => {
    const fn = stagger(100, { ease: quadIn });
    // quadIn makes initial delays smaller
    const linearFn = stagger(100);

    // At index 1 of 5: position = 0.25
    // quadIn(0.25) = 0.0625 vs linear 0.25
    const easedDelay = fn(1, 5);
    const linearDelay = linearFn(1, 5);
    expect(easedDelay).toBeLessThan(linearDelay);
  });

  it('should handle from: "center" with even number of elements', () => {
    const fn = stagger(100, { from: 'center' });
    // 4 elements, center = 1.5
    // Symmetric around center
    expect(fn(0, 4)).toBe(fn(3, 4));
    expect(fn(1, 4)).toBe(fn(2, 4));
    // Outer elements have more delay
    expect(fn(0, 4)).toBeGreaterThan(fn(1, 4));
  });
});
