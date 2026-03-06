import type { TransformShorthand } from './types';

/** Internal transform state for a single element */
export interface TransformState {
  x: number;
  y: number;
  z: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  rotation: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  skewX: number;
  skewY: number;
}

/** Default identity transform state */
function createDefaultState(): TransformState {
  return {
    x: 0,
    y: 0,
    z: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    rotation: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    skewX: 0,
    skewY: 0,
  };
}

/** WeakMap storing per-element transform state */
const transformStates = new WeakMap<Element, TransformState>();

/** Get or create transform state for an element */
export function getTransformState(element: Element): TransformState {
  let state = transformStates.get(element);
  if (!state) {
    state = createDefaultState();
    transformStates.set(element, state);
  }
  return state;
}

/** Check if a property name is a transform shorthand */
export function isTransformShorthand(property: string): property is TransformShorthand {
  return property in TRANSFORM_DEFAULTS;
}

/** Map shorthand to its key in TransformState (handles 'scale' -> scaleX+scaleY) */
export function getShorthandKey(property: TransformShorthand): keyof TransformState | 'scale' {
  if (property === 'scale') return 'scale';
  return property as keyof TransformState;
}

/** Default values for transform shorthands */
const TRANSFORM_DEFAULTS: Record<TransformShorthand, number> = {
  x: 0,
  y: 0,
  z: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1,
  rotation: 0,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  skewX: 0,
  skewY: 0,
};

/** Get the default value for a transform shorthand */
export function getTransformDefault(property: TransformShorthand): number {
  return TRANSFORM_DEFAULTS[property];
}

/** Apply a transform state change for a single property */
export function setTransformValue(
  state: TransformState,
  property: TransformShorthand,
  value: number,
): void {
  if (property === 'scale') {
    state.scaleX = value;
    state.scaleY = value;
  } else {
    state[property] = value;
  }
}

/** Read the current value of a transform shorthand from state */
export function getTransformValue(state: TransformState, property: TransformShorthand): number {
  if (property === 'scale') {
    return state.scaleX; // assume uniform when reading
  }
  return state[property];
}

/**
 * Compose a TransformState into a CSS transform string.
 * Order: translate -> rotate -> skew -> scale (documented convention)
 */
export function composeTransform(state: TransformState): string {
  const parts: string[] = [];

  // Translate
  if (state.x !== 0 || state.y !== 0 || state.z !== 0) {
    if (state.z !== 0) {
      parts.push(`translate3d(${state.x}px, ${state.y}px, ${state.z}px)`);
    } else {
      parts.push(`translate(${state.x}px, ${state.y}px)`);
    }
  }

  // Rotate
  if (state.rotation !== 0) {
    parts.push(`rotate(${state.rotation}deg)`);
  }
  if (state.rotationX !== 0) {
    parts.push(`rotateX(${state.rotationX}deg)`);
  }
  if (state.rotationY !== 0) {
    parts.push(`rotateY(${state.rotationY}deg)`);
  }
  if (state.rotationZ !== 0) {
    parts.push(`rotateZ(${state.rotationZ}deg)`);
  }

  // Skew
  if (state.skewX !== 0 || state.skewY !== 0) {
    parts.push(`skew(${state.skewX}deg, ${state.skewY}deg)`);
  }

  // Scale
  if (state.scaleX !== 1 || state.scaleY !== 1 || state.scaleZ !== 1) {
    if (state.scaleZ !== 1) {
      parts.push(`scale3d(${state.scaleX}, ${state.scaleY}, ${state.scaleZ})`);
    } else if (state.scaleX === state.scaleY) {
      parts.push(`scale(${state.scaleX})`);
    } else {
      parts.push(`scale(${state.scaleX}, ${state.scaleY})`);
    }
  }

  return parts.join(' ') || 'none';
}
