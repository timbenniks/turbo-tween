import { describe, it, expect } from 'vitest';
import { createElement, useEffect } from 'react';
import { render, act } from '@testing-library/react';
import { useTween } from '../../src/react/useTween';
import { linear } from '../../src/easings';
import type { TweenInstance } from '../../src/types';
import { advanceTime } from '../setup';

function TestComponent({ onApi }: { onApi: (api: ReturnType<typeof useTween>) => void }) {
  const api = useTween();
  useEffect(() => {
    onApi(api);
  }, []);
  return createElement('div');
}

describe('React useTween hook', () => {
  it('should provide to() that returns a tween instance', () => {
    let tween: TweenInstance | undefined;
    render(
      createElement(TestComponent, {
        onApi: (api) => {
          tween = api.to({ value: 0 }, 500, { value: 100, ease: linear });
        },
      }),
    );
    expect(tween).toBeDefined();
    if (!tween) {
      throw new Error('Expected tween instance');
    }
    expect(tween.isActive).toBe(true);
  });

  it('should fire onComplete callback in to()', () => {
    let called = false;
    render(
      createElement(TestComponent, {
        onApi: (api) => {
          api.to({ value: 0 }, 0, {
            value: 100,
            ease: linear,
            onComplete: () => {
              called = true;
            },
          });
        },
      }),
    );
    act(() => {
      advanceTime(1);
    });
    expect(called).toBe(true);
  });

  it('should provide from() that returns a tween instance', () => {
    let tween: TweenInstance | undefined;
    render(
      createElement(TestComponent, {
        onApi: (api) => {
          tween = api.from({ value: 100 }, 500, { value: 0, ease: linear });
        },
      }),
    );
    expect(tween).toBeDefined();
    if (!tween) {
      throw new Error('Expected tween instance');
    }
    expect(tween.isActive).toBe(true);
  });

  it('should fire onComplete callback in from()', () => {
    let called = false;
    render(
      createElement(TestComponent, {
        onApi: (api) => {
          api.from({ value: 100 }, 0, {
            value: 0,
            ease: linear,
            onComplete: () => {
              called = true;
            },
          });
        },
      }),
    );
    act(() => {
      advanceTime(1);
    });
    expect(called).toBe(true);
  });

  it('should provide fromTo() that returns a tween instance', () => {
    let tween: TweenInstance | undefined;
    render(
      createElement(TestComponent, {
        onApi: (api) => {
          tween = api.fromTo({ value: 0 }, 500, { value: 0 }, { value: 100, ease: linear });
        },
      }),
    );
    expect(tween).toBeDefined();
    if (!tween) {
      throw new Error('Expected tween instance');
    }
    expect(tween.isActive).toBe(true);
  });

  it('should fire onComplete callback in fromTo()', () => {
    let called = false;
    render(
      createElement(TestComponent, {
        onApi: (api) => {
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
        },
      }),
    );
    act(() => {
      advanceTime(1);
    });
    expect(called).toBe(true);
  });

  it('should provide killAll()', () => {
    let api: ReturnType<typeof useTween> | undefined;
    render(
      createElement(TestComponent, {
        onApi: (a) => {
          api = a;
          a.to({ value: 0 }, 1000, { value: 100, ease: linear });
        },
      }),
    );
    act(() => {
      api!.killAll();
    });
  });

  it('should provide killTweensOf()', () => {
    let api: ReturnType<typeof useTween> | undefined;
    const target = { value: 0 };
    render(
      createElement(TestComponent, {
        onApi: (a) => {
          api = a;
          a.to(target, 1000, { value: 100, ease: linear });
        },
      }),
    );
    act(() => {
      api!.killTweensOf(target);
    });
  });

  it('should clean up on unmount', () => {
    const { unmount } = render(
      createElement(TestComponent, {
        onApi: (a) => {
          a.to({ value: 0 }, 5000, { value: 100, ease: linear });
        },
      }),
    );
    unmount();
  });
});
