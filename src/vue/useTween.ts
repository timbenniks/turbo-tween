import { ref, onUnmounted, getCurrentInstance, type Ref } from 'vue';
import type { AnimatableTarget, TweenInstance, TweenOptions } from '../types';
import { TweenEngine } from '../engine';

/**
 * Vue composable for Turbo-Tween.
 * Creates a scoped engine that auto-cleans all tweens on component unmount.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useTween } from 'turbo-tween/vue';
 * import { quadOut } from 'turbo-tween';
 *
 * const { to, isAnimating } = useTween();
 *
 * function animate(el: HTMLElement) {
 *   to(el, 1000, { x: 100, ease: quadOut });
 * }
 * </script>
 * ```
 */
export function useTween() {
  const engine = new TweenEngine();
  const isAnimating = ref(false);

  const updateState = () => {
    isAnimating.value = engine.activeCount > 0;
  };

  const to = (
    target: AnimatableTarget,
    duration: number,
    options: TweenOptions = {},
  ): TweenInstance => {
    const tween = engine.to(target, duration, {
      ...options,
      onComplete: () => {
        options.onComplete?.();
        updateState();
      },
    });
    updateState();
    return tween;
  };

  const from = (
    target: AnimatableTarget,
    duration: number,
    options: TweenOptions = {},
  ): TweenInstance => {
    const tween = engine.from(target, duration, {
      ...options,
      onComplete: () => {
        options.onComplete?.();
        updateState();
      },
    });
    updateState();
    return tween;
  };

  const fromTo = (
    target: AnimatableTarget,
    duration: number,
    fromVars: Record<string, unknown>,
    toVars: TweenOptions = {},
  ): TweenInstance => {
    const tween = engine.fromTo(target, duration, fromVars, {
      ...toVars,
      onComplete: () => {
        toVars.onComplete?.();
        updateState();
      },
    });
    updateState();
    return tween;
  };

  const killAll = (): void => {
    engine.killAll();
    updateState();
  };

  const killTweensOf = (target: AnimatableTarget): void => {
    engine.killTweensOf(target);
    updateState();
  };

  // Auto-cleanup on unmount
  if (getCurrentInstance()) {
    onUnmounted(() => {
      engine.killAll();
    });
  }

  return {
    to,
    from,
    fromTo,
    killAll,
    killTweensOf,
    isAnimating: isAnimating as Readonly<Ref<boolean>>,
  };
}
