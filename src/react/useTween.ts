import { useRef, useEffect, useState, useCallback } from 'react';
import type { AnimatableTarget, TweenInstance, TweenOptions } from '../types';
import { TweenEngine } from '../engine';

/**
 * React hook for Turbo-Tween.
 * Creates a scoped engine that auto-cleans all tweens on unmount.
 * Handles React strict mode double-mounting gracefully.
 *
 * @example
 * ```tsx
 * import { useTween } from 'turbo-tween/react';
 * import { quadOut } from 'turbo-tween';
 *
 * function Component() {
 *   const ref = useRef<HTMLDivElement>(null);
 *   const { to, isAnimating } = useTween();
 *
 *   useEffect(() => {
 *     if (ref.current) {
 *       to(ref.current, 1000, { x: 100, ease: quadOut });
 *     }
 *   }, []);
 *
 *   return <div ref={ref}>Animated</div>;
 * }
 * ```
 */
export function useTween() {
  const engineRef = useRef<TweenEngine | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Lazy-init engine (survives strict mode remount)
  const getEngine = useCallback((): TweenEngine => {
    if (!engineRef.current) {
      engineRef.current = new TweenEngine();
    }
    return engineRef.current;
  }, []);

  const updateState = useCallback(() => {
    const engine = engineRef.current;
    setIsAnimating(engine ? engine.activeCount > 0 : false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.killAll();
      engineRef.current = null;
    };
  }, []);

  const to = useCallback(
    (target: AnimatableTarget, duration: number, options: TweenOptions = {}): TweenInstance => {
      const engine = getEngine();
      const tween = engine.to(target, duration, {
        ...options,
        onComplete: () => {
          options.onComplete?.();
          updateState();
        },
      });
      updateState();
      return tween;
    },
    [getEngine, updateState],
  );

  const from = useCallback(
    (target: AnimatableTarget, duration: number, options: TweenOptions = {}): TweenInstance => {
      const engine = getEngine();
      const tween = engine.from(target, duration, {
        ...options,
        onComplete: () => {
          options.onComplete?.();
          updateState();
        },
      });
      updateState();
      return tween;
    },
    [getEngine, updateState],
  );

  const fromTo = useCallback(
    (
      target: AnimatableTarget,
      duration: number,
      fromVars: Record<string, unknown>,
      toVars: TweenOptions = {},
    ): TweenInstance => {
      const engine = getEngine();
      const tween = engine.fromTo(target, duration, fromVars, {
        ...toVars,
        onComplete: () => {
          toVars.onComplete?.();
          updateState();
        },
      });
      updateState();
      return tween;
    },
    [getEngine, updateState],
  );

  const killAll = useCallback((): void => {
    engineRef.current?.killAll();
    updateState();
  }, [updateState]);

  const killTweensOf = useCallback(
    (target: AnimatableTarget): void => {
      engineRef.current?.killTweensOf(target);
      updateState();
    },
    [updateState],
  );

  return {
    to,
    from,
    fromTo,
    killAll,
    killTweensOf,
    isAnimating,
  };
}
