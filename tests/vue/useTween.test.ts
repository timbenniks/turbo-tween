import { describe, it, expect } from 'vite-plus/test';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { useTween } from '../../src/vue/useTween';
import { linear } from '../../src/easings';
import { defaultClock } from '../../src/clock';

function mountWithTween(setup: (api: ReturnType<typeof useTween>) => void) {
  return mount(
    defineComponent({
      setup() {
        const api = useTween();
        setup(api);
        return () => h('div');
      },
    }),
  );
}

describe('Vue useTween composable', () => {
  it('should provide to() that returns a tween instance', () => {
    let tween: ReturnType<ReturnType<typeof useTween>['to']> | undefined;
    mountWithTween((api) => {
      tween = api.to({ value: 0 }, 500, { value: 100, ease: linear });
    });
    expect(tween).toBeDefined();
    expect(tween!.isActive).toBe(true);
  });

  it('should fire onComplete callback in to()', () => {
    let called = false;
    mountWithTween((api) => {
      api.to({ value: 0 }, 0, {
        value: 100,
        ease: linear,
        onComplete: () => {
          called = true;
        },
      });
    });
    // Force the clock to tick so zero-duration tween completes
    defaultClock.tick(0);
    defaultClock.tick(1);
    expect(called).toBe(true);
  });

  it('should provide from() that returns a tween instance', () => {
    let tween: ReturnType<ReturnType<typeof useTween>['from']> | undefined;
    mountWithTween((api) => {
      tween = api.from({ value: 100 }, 500, { value: 0, ease: linear });
    });
    expect(tween).toBeDefined();
    expect(tween!.isActive).toBe(true);
  });

  it('should fire onComplete callback in from()', () => {
    let called = false;
    mountWithTween((api) => {
      api.from({ value: 100 }, 0, {
        value: 0,
        ease: linear,
        onComplete: () => {
          called = true;
        },
      });
    });
    defaultClock.tick(0);
    defaultClock.tick(1);
    expect(called).toBe(true);
  });

  it('should provide fromTo() that returns a tween instance', () => {
    let tween: ReturnType<ReturnType<typeof useTween>['fromTo']> | undefined;
    mountWithTween((api) => {
      tween = api.fromTo({ value: 0 }, 500, { value: 0 }, { value: 100, ease: linear });
    });
    expect(tween).toBeDefined();
    expect(tween!.isActive).toBe(true);
  });

  it('should fire onComplete callback in fromTo()', () => {
    let called = false;
    mountWithTween((api) => {
      api.fromTo(
        { value: 0 },
        0,
        { value: 0 },
        {
          value: 100,
          ease: linear,
          onComplete: () => {
            called = true;
          },
        },
      );
    });
    defaultClock.tick(0);
    defaultClock.tick(1);
    expect(called).toBe(true);
  });

  it('should kill all tweens via killAll()', () => {
    let api: ReturnType<typeof useTween> | undefined;
    mountWithTween((a) => {
      api = a;
      a.to({ value: 0 }, 1000, { value: 100, ease: linear });
      a.to({ other: 0 }, 1000, { other: 50, ease: linear });
    });
    api!.killAll();
    expect(api!.isAnimating.value).toBe(false);
  });

  it('should kill tweens of specific target via killTweensOf()', () => {
    let api: ReturnType<typeof useTween> | undefined;
    const t1 = { value: 0 };
    const t2 = { value: 0 };
    mountWithTween((a) => {
      api = a;
      a.to(t1, 1000, { value: 100, ease: linear });
      a.to(t2, 1000, { value: 100, ease: linear });
    });
    api!.killTweensOf(t1);
    expect(api!.isAnimating.value).toBe(true);
  });

  it('should clean up tweens on unmount', () => {
    let api: ReturnType<typeof useTween> | undefined;
    const wrapper = mountWithTween((a) => {
      api = a;
      a.to({ value: 0 }, 5000, { value: 100, ease: linear });
    });
    expect(api!.isAnimating.value).toBe(true);
    wrapper.unmount();
  });
});
