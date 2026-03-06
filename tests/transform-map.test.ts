import { describe, it, expect } from 'vitest';
import {
  getTransformState,
  isTransformShorthand,
  getShorthandKey,
  getTransformDefault,
  setTransformValue,
  getTransformValue,
  composeTransform,
} from '../src/transform-map';

describe('transform-map', () => {
  describe('isTransformShorthand', () => {
    it('should recognize valid shorthands', () => {
      expect(isTransformShorthand('x')).toBe(true);
      expect(isTransformShorthand('y')).toBe(true);
      expect(isTransformShorthand('z')).toBe(true);
      expect(isTransformShorthand('scale')).toBe(true);
      expect(isTransformShorthand('scaleX')).toBe(true);
      expect(isTransformShorthand('scaleY')).toBe(true);
      expect(isTransformShorthand('scaleZ')).toBe(true);
      expect(isTransformShorthand('rotation')).toBe(true);
      expect(isTransformShorthand('rotationX')).toBe(true);
      expect(isTransformShorthand('rotationY')).toBe(true);
      expect(isTransformShorthand('rotationZ')).toBe(true);
      expect(isTransformShorthand('skewX')).toBe(true);
      expect(isTransformShorthand('skewY')).toBe(true);
    });

    it('should reject non-shorthands', () => {
      expect(isTransformShorthand('opacity')).toBe(false);
      expect(isTransformShorthand('width')).toBe(false);
      expect(isTransformShorthand('transform')).toBe(false);
    });
  });

  describe('getShorthandKey', () => {
    it('should return "scale" for scale shorthand', () => {
      expect(getShorthandKey('scale')).toBe('scale');
    });

    it('should return the property itself for non-scale shorthands', () => {
      expect(getShorthandKey('x')).toBe('x');
      expect(getShorthandKey('rotation')).toBe('rotation');
      expect(getShorthandKey('scaleX')).toBe('scaleX');
      expect(getShorthandKey('rotationX')).toBe('rotationX');
    });
  });

  describe('getTransformDefault', () => {
    it('should return 0 for translation/rotation/skew', () => {
      expect(getTransformDefault('x')).toBe(0);
      expect(getTransformDefault('y')).toBe(0);
      expect(getTransformDefault('z')).toBe(0);
      expect(getTransformDefault('rotation')).toBe(0);
      expect(getTransformDefault('rotationX')).toBe(0);
      expect(getTransformDefault('skewX')).toBe(0);
    });

    it('should return 1 for scale properties', () => {
      expect(getTransformDefault('scale')).toBe(1);
      expect(getTransformDefault('scaleX')).toBe(1);
      expect(getTransformDefault('scaleY')).toBe(1);
      expect(getTransformDefault('scaleZ')).toBe(1);
    });
  });

  describe('getTransformState', () => {
    it('should return default identity state for new elements', () => {
      const el = document.createElement('div');
      const state = getTransformState(el);

      expect(state.x).toBe(0);
      expect(state.y).toBe(0);
      expect(state.z).toBe(0);
      expect(state.scaleX).toBe(1);
      expect(state.scaleY).toBe(1);
      expect(state.scaleZ).toBe(1);
      expect(state.rotation).toBe(0);
      expect(state.rotationX).toBe(0);
      expect(state.rotationY).toBe(0);
      expect(state.rotationZ).toBe(0);
      expect(state.skewX).toBe(0);
      expect(state.skewY).toBe(0);
    });

    it('should return the same state for the same element', () => {
      const el = document.createElement('div');
      const state1 = getTransformState(el);
      const state2 = getTransformState(el);
      expect(state1).toBe(state2);
    });

    it('should return different states for different elements', () => {
      const el1 = document.createElement('div');
      const el2 = document.createElement('div');
      expect(getTransformState(el1)).not.toBe(getTransformState(el2));
    });
  });

  describe('setTransformValue / getTransformValue', () => {
    it('should set and get individual properties', () => {
      const el = document.createElement('div');
      const state = getTransformState(el);

      setTransformValue(state, 'x', 100);
      expect(getTransformValue(state, 'x')).toBe(100);

      setTransformValue(state, 'rotation', 45);
      expect(getTransformValue(state, 'rotation')).toBe(45);
    });

    it('should set both scaleX and scaleY for scale shorthand', () => {
      const el = document.createElement('div');
      const state = getTransformState(el);

      setTransformValue(state, 'scale', 2);
      expect(state.scaleX).toBe(2);
      expect(state.scaleY).toBe(2);
    });

    it('should read scaleX as the scale value', () => {
      const el = document.createElement('div');
      const state = getTransformState(el);

      setTransformValue(state, 'scale', 3);
      expect(getTransformValue(state, 'scale')).toBe(3);
    });

    it('should set and get rotationX/Y/Z individually', () => {
      const el = document.createElement('div');
      const state = getTransformState(el);

      setTransformValue(state, 'rotationX', 30);
      setTransformValue(state, 'rotationY', 60);
      setTransformValue(state, 'rotationZ', 90);
      expect(getTransformValue(state, 'rotationX')).toBe(30);
      expect(getTransformValue(state, 'rotationY')).toBe(60);
      expect(getTransformValue(state, 'rotationZ')).toBe(90);
    });

    it('should set and get scaleZ individually', () => {
      const el = document.createElement('div');
      const state = getTransformState(el);

      setTransformValue(state, 'scaleZ', 1.5);
      expect(getTransformValue(state, 'scaleZ')).toBe(1.5);
    });
  });

  describe('composeTransform', () => {
    it('should return none for identity state', () => {
      const el = document.createElement('div');
      const state = getTransformState(el);
      expect(composeTransform(state)).toBe('none');
    });

    it('should compose translate', () => {
      const el = document.createElement('div');
      const state = getTransformState(el);
      setTransformValue(state, 'x', 100);
      setTransformValue(state, 'y', 50);
      expect(composeTransform(state)).toBe('translate(100px, 50px)');
    });

    it('should compose translate + rotate + scale', () => {
      const el = document.createElement('div');
      const state = getTransformState(el);
      setTransformValue(state, 'x', 100);
      setTransformValue(state, 'rotation', 45);
      setTransformValue(state, 'scale', 2);

      const result = composeTransform(state);
      expect(result).toContain('translate(100px, 0px)');
      expect(result).toContain('rotate(45deg)');
      expect(result).toContain('scale(2)');
    });

    it('should use translate3d when z is set', () => {
      const el = document.createElement('div');
      const state = getTransformState(el);
      setTransformValue(state, 'x', 10);
      setTransformValue(state, 'z', 20);
      expect(composeTransform(state)).toContain('translate3d(10px, 0px, 20px)');
    });

    it('should follow order: translate -> rotate -> skew -> scale', () => {
      const el = document.createElement('div');
      const state = getTransformState(el);
      setTransformValue(state, 'scale', 2);
      setTransformValue(state, 'rotation', 45);
      setTransformValue(state, 'x', 100);
      setTransformValue(state, 'skewX', 10);

      const result = composeTransform(state);
      const translateIdx = result.indexOf('translate');
      const rotateIdx = result.indexOf('rotate');
      const skewIdx = result.indexOf('skew');
      const scaleIdx = result.indexOf('scale');

      expect(translateIdx).toBeLessThan(rotateIdx);
      expect(rotateIdx).toBeLessThan(skewIdx);
      expect(skewIdx).toBeLessThan(scaleIdx);
    });

    it('should compose rotateX/Y/Z', () => {
      const el = document.createElement('div');
      const state = getTransformState(el);
      setTransformValue(state, 'rotationX', 30);
      setTransformValue(state, 'rotationY', 60);
      setTransformValue(state, 'rotationZ', 90);

      const result = composeTransform(state);
      expect(result).toContain('rotateX(30deg)');
      expect(result).toContain('rotateY(60deg)');
      expect(result).toContain('rotateZ(90deg)');
    });

    it('should use scale3d when scaleZ is set', () => {
      const el = document.createElement('div');
      const state = getTransformState(el);
      setTransformValue(state, 'scaleX', 2);
      setTransformValue(state, 'scaleY', 2);
      setTransformValue(state, 'scaleZ', 1.5);

      const result = composeTransform(state);
      expect(result).toContain('scale3d(2, 2, 1.5)');
    });

    it('should use scale(x, y) when scaleX !== scaleY', () => {
      const el = document.createElement('div');
      const state = getTransformState(el);
      setTransformValue(state, 'scaleX', 2);
      setTransformValue(state, 'scaleY', 3);

      const result = composeTransform(state);
      expect(result).toContain('scale(2, 3)');
    });
  });
});
