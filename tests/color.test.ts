import { describe, it, expect } from 'vitest';
import { isColorValue, parseColor, interpolateColor, colorToString } from '../src/color';

describe('isColorValue', () => {
  it('should detect hex colors', () => {
    expect(isColorValue('#fff')).toBe(true);
    expect(isColorValue('#ff0000')).toBe(true);
  });

  it('should detect rgb/rgba', () => {
    expect(isColorValue('rgb(255, 0, 0)')).toBe(true);
    expect(isColorValue('rgba(0, 0, 0, 0.5)')).toBe(true);
  });

  it('should detect hsl/hsla', () => {
    expect(isColorValue('hsl(120, 50%, 50%)')).toBe(true);
    expect(isColorValue('hsla(0, 100%, 50%, 0.8)')).toBe(true);
  });

  it('should reject non-color values', () => {
    expect(isColorValue('100px')).toBe(false);
    expect(isColorValue('auto')).toBe(false);
  });
});

describe('parseColor', () => {
  it('should parse 3-digit hex', () => {
    const c = parseColor('#f00');
    expect(c).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it('should parse 6-digit hex', () => {
    const c = parseColor('#00ff00');
    expect(c).toEqual({ r: 0, g: 255, b: 0, a: 1 });
  });

  it('should parse 8-digit hex with alpha', () => {
    const c = parseColor('#ff000080');
    expect(c).not.toBeNull();
    expect(c!.r).toBe(255);
    expect(c!.a).toBeCloseTo(0.502, 1);
  });

  it('should parse rgb()', () => {
    const c = parseColor('rgb(100, 200, 50)');
    expect(c).toEqual({ r: 100, g: 200, b: 50, a: 1 });
  });

  it('should parse rgba()', () => {
    const c = parseColor('rgba(100, 200, 50, 0.5)');
    expect(c).toEqual({ r: 100, g: 200, b: 50, a: 0.5 });
  });

  it('should parse hsl()', () => {
    const c = parseColor('hsl(0, 100%, 50%)');
    expect(c).not.toBeNull();
    expect(c!.r).toBe(255);
    expect(c!.g).toBe(0);
    expect(c!.b).toBe(0);
  });

  it('should parse 4-digit hex (#rgba)', () => {
    const c = parseColor('#f008');
    expect(c).not.toBeNull();
    expect(c!.r).toBe(255);
    expect(c!.g).toBe(0);
    expect(c!.b).toBe(0);
    expect(c!.a).toBeCloseTo(0.533, 1);
  });

  it('should parse hsl with saturation=0 (grayscale)', () => {
    const c = parseColor('hsl(0, 0%, 50%)');
    expect(c).not.toBeNull();
    expect(c!.r).toBe(128);
    expect(c!.g).toBe(128);
    expect(c!.b).toBe(128);
  });

  it('should parse hsla() with alpha', () => {
    const c = parseColor('hsla(120, 100%, 50%, 0.7)');
    expect(c).not.toBeNull();
    expect(c!.g).toBe(255);
    expect(c!.a).toBeCloseTo(0.7, 2);
  });

  it('should return null for invalid colors', () => {
    expect(parseColor('not-a-color')).toBeNull();
    expect(parseColor('100px')).toBeNull();
  });
});

describe('interpolateColor', () => {
  it('should interpolate between two colors', () => {
    const from = { r: 0, g: 0, b: 0, a: 1 };
    const to = { r: 255, g: 255, b: 255, a: 1 };

    const mid = interpolateColor(from, to, 0.5);
    expect(mid.r).toBe(128);
    expect(mid.g).toBe(128);
    expect(mid.b).toBe(128);
    expect(mid.a).toBe(1);
  });

  it('should return start color at progress 0', () => {
    const from = { r: 100, g: 50, b: 200, a: 1 };
    const to = { r: 200, g: 100, b: 50, a: 0 };

    const result = interpolateColor(from, to, 0);
    expect(result.r).toBe(100);
    expect(result.a).toBe(1);
  });

  it('should return end color at progress 1', () => {
    const from = { r: 100, g: 50, b: 200, a: 1 };
    const to = { r: 200, g: 100, b: 50, a: 0 };

    const result = interpolateColor(from, to, 1);
    expect(result.r).toBe(200);
    expect(result.a).toBe(0);
  });
});

describe('colorToString', () => {
  it('should output rgb() for opaque colors', () => {
    expect(colorToString({ r: 255, g: 0, b: 0, a: 1 })).toBe('rgb(255, 0, 0)');
  });

  it('should output rgba() for transparent colors', () => {
    expect(colorToString({ r: 255, g: 0, b: 0, a: 0.5 })).toBe('rgba(255, 0, 0, 0.5)');
  });
});
