import { describe, it, expect } from 'vitest';
import { clamp, noop, isObject, toKebabCase } from '../src/utils';

describe('clamp', () => {
  it('should return value when in range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('should clamp to min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('should clamp to max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('noop', () => {
  it('should return undefined', () => {
    expect(noop()).toBeUndefined();
  });
});

describe('isObject', () => {
  it('should return true for plain objects', () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ a: 1 })).toBe(true);
  });

  it('should return false for non-objects', () => {
    expect(isObject(null)).toBe(false);
    expect(isObject(undefined)).toBe(false);
    expect(isObject(42)).toBe(false);
    expect(isObject('str')).toBe(false);
    expect(isObject([])).toBe(false);
  });
});

describe('toKebabCase', () => {
  it('should convert camelCase to kebab-case', () => {
    expect(toKebabCase('backgroundColor')).toBe('background-color');
    expect(toKebabCase('borderTopWidth')).toBe('border-top-width');
  });

  it('should leave lowercase strings unchanged', () => {
    expect(toKebabCase('opacity')).toBe('opacity');
  });
});
