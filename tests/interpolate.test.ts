import { describe, it, expect } from 'vitest';
import {
  readProperty,
  writeProperty,
  createPropertyAnimation,
  updatePropertyAnimation,
} from '../src/interpolate';

describe('readProperty', () => {
  it('should read inline style from an element', () => {
    const el = document.createElement('div');
    el.style.opacity = '0.5';
    expect(readProperty(el, 'opacity')).toBe('0.5');
  });

  it('should fall back to computed style', () => {
    const el = document.createElement('div');
    // No inline style set, should return computed (empty string in jsdom)
    const result = readProperty(el, 'color');
    expect(typeof result).toBe('string');
  });

  it('should read a property from a plain object', () => {
    const obj = { value: 42 };
    expect(readProperty(obj, 'value')).toBe(42);
  });

  it('should return undefined for missing object properties', () => {
    const obj = { value: 42 };
    expect(readProperty(obj, 'other')).toBeUndefined();
  });
});

describe('writeProperty', () => {
  it('should write a style property to an element', () => {
    const el = document.createElement('div');
    writeProperty(el, 'opacity', '0.5');
    expect(el.style.opacity).toBe('0.5');
  });

  it('should write a property to a plain object', () => {
    const obj: Record<string, unknown> = { value: 0 };
    writeProperty(obj, 'value', 100);
    expect(obj.value).toBe(100);
  });
});

describe('createPropertyAnimation', () => {
  it('should create a numeric animation for a plain object', () => {
    const obj = { value: 10 };
    const anim = createPropertyAnimation(obj, 'value', 100);
    expect(anim.startNum).toBe(10);
    expect(anim.endNum).toBe(100);
    expect(anim.isStyle).toBe(false);
    expect(anim.isColor).toBe(false);
    expect(anim.unit).toBe('');
  });

  it('should use fromValue when provided', () => {
    const obj = { value: 999 };
    const anim = createPropertyAnimation(obj, 'value', 100, 0);
    expect(anim.startNum).toBe(0);
    expect(anim.endNum).toBe(100);
  });

  it('should detect units from string values', () => {
    const el = document.createElement('div');
    el.style.width = '50px';
    const anim = createPropertyAnimation(el, 'width', '100px');
    expect(anim.unit).toBe('px');
    expect(anim.endNum).toBe(100);
  });

  it('should detect unit from endValue when startValue has no unit', () => {
    const obj = { value: 0 };
    const anim = createPropertyAnimation(obj, 'value', '100%');
    expect(anim.unit).toBe('%');
  });

  it('should handle color values for elements', () => {
    const el = document.createElement('div');
    el.style.backgroundColor = 'rgb(255, 0, 0)';
    const anim = createPropertyAnimation(el, 'backgroundColor', '#00ff00');
    expect(anim.isColor).toBe(true);
    expect(anim.startColor).not.toBeNull();
    expect(anim.endColor).not.toBeNull();
  });

  it('should handle zero start values', () => {
    const obj = { value: 0 };
    const anim = createPropertyAnimation(obj, 'value', 50);
    expect(anim.startNum).toBe(0);
    expect(anim.endNum).toBe(50);
  });
});

describe('updatePropertyAnimation', () => {
  it('should interpolate numeric values on a plain object', () => {
    const obj = { value: 0 };
    const anim = createPropertyAnimation(obj, 'value', 100);

    updatePropertyAnimation(obj, anim, 0.5);
    expect(obj.value).toBeCloseTo(50, 0);

    updatePropertyAnimation(obj, anim, 1);
    expect(obj.value).toBeCloseTo(100, 0);
  });

  it('should interpolate at progress 0', () => {
    const obj = { value: 0 };
    const anim = createPropertyAnimation(obj, 'value', 100);

    updatePropertyAnimation(obj, anim, 0);
    expect(obj.value).toBeCloseTo(0, 0);
  });

  it('should write style values with units on elements', () => {
    const el = document.createElement('div');
    const anim = createPropertyAnimation(el, 'width', '100px', '0px');

    updatePropertyAnimation(el, anim, 0.5);
    // The style should have the value with a unit
    expect(el.style.getPropertyValue('width')).toContain('50');
  });

  it('should interpolate colors when isColor is true', () => {
    const el = document.createElement('div');
    el.style.backgroundColor = 'rgb(0, 0, 0)';
    const anim = createPropertyAnimation(el, 'backgroundColor', 'rgb(255, 255, 255)');

    if (anim.isColor) {
      updatePropertyAnimation(el, anim, 0.5);
      const bg = el.style.getPropertyValue('background-color');
      expect(bg).toContain('128');
    }
  });
});
