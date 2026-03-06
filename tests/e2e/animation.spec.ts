import { test, expect, type Page } from '@playwright/test';

interface TweenHandle extends PromiseLike<unknown> {
  pause: () => TweenHandle;
  seek: (timeMs: number) => TweenHandle;
  kill: () => void;
}

interface TimelineHandle {
  to: (...args: unknown[]) => TimelineHandle;
  staggerTo: (...args: unknown[]) => TimelineHandle;
  play: () => void;
  seek: (timeMs: number) => void;
}

interface TurboTweenApi {
  Tween: {
    to: (...args: unknown[]) => TweenHandle;
    from: (...args: unknown[]) => TweenHandle;
    fromTo: (...args: unknown[]) => TweenHandle;
  };
  Timeline: new () => TimelineHandle;
  stagger: (...args: unknown[]) => (...innerArgs: unknown[]) => number;
  linear: (t: number) => number;
}

declare global {
  interface Window {
    __ready?: boolean;
    __turboTween?: TurboTweenApi;
  }
}

async function waitForReady(page: Page) {
  await page.waitForFunction(() => window.__ready === true, null, {
    timeout: 5000,
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await waitForReady(page);
});

test.describe('Tween.to() — real browser animation', () => {
  test('should animate translateX on an element', async ({ page }) => {
    // Start animation: move box 200px to the right over 500ms
    await page.evaluate(() => {
      const { Tween, linear } = window.__turboTween!;
      const box = document.getElementById('box')!;
      Tween.to(box, 500, { x: 200, ease: linear });
    });

    // Wait for animation to complete
    await page.waitForTimeout(600);

    // Check that the transform was applied
    const transform = await page.locator('#box').evaluate((el) => getComputedStyle(el).transform);

    // Should contain a matrix with translateX ≈ 200
    // matrix(1, 0, 0, 1, 200, 0) or similar
    expect(transform).not.toBe('none');
    expect(transform).toContain('matrix');

    // Parse the translateX from the matrix
    const match = transform.match(/matrix\(([^)]+)\)/);
    expect(match).toBeTruthy();
    const matrixValues = match?.[1];
    expect(matrixValues).toBeTruthy();
    if (!matrixValues) {
      throw new Error('Expected matrix values');
    }
    const values = matrixValues.split(',').map(Number);
    // matrix(a, b, c, d, tx, ty) — tx is index 4
    const tx = values[4];
    expect(tx).not.toBeUndefined();
    if (tx === undefined) {
      throw new Error('Expected translateX value in matrix');
    }
    expect(tx).toBeCloseTo(200, 0);
  });

  test('should animate opacity', async ({ page }) => {
    await page.evaluate(() => {
      const { Tween, linear } = window.__turboTween!;
      const box = document.getElementById('box')!;
      Tween.to(box, 300, { opacity: 0.2, ease: linear });
    });

    await page.waitForTimeout(400);

    const opacity = await page.locator('#box').evaluate((el) => getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeCloseTo(0.2, 1);
  });

  test('should animate rotation', async ({ page }) => {
    await page.evaluate(() => {
      const { Tween, linear } = window.__turboTween!;
      const box = document.getElementById('box')!;
      Tween.to(box, 400, { rotation: 90, ease: linear });
    });

    await page.waitForTimeout(500);

    const transform = await page.locator('#box').evaluate((el) => el.style.transform);
    expect(transform).toContain('rotate(90deg)');
  });

  test('should animate scale', async ({ page }) => {
    await page.evaluate(() => {
      const { Tween, linear } = window.__turboTween!;
      const box = document.getElementById('box')!;
      Tween.to(box, 400, { scale: 2, ease: linear });
    });

    await page.waitForTimeout(500);

    const transform = await page.locator('#box').evaluate((el) => el.style.transform);
    expect(transform).toContain('scale(2)');
  });

  test('should compose multiple transform shorthands', async ({ page }) => {
    await page.evaluate(() => {
      const { Tween, linear } = window.__turboTween!;
      const box = document.getElementById('box')!;
      Tween.to(box, 400, { x: 100, rotation: 45, scale: 1.5, ease: linear });
    });

    await page.waitForTimeout(500);

    const transform = await page.locator('#box').evaluate((el) => el.style.transform);
    // Should follow composition order: translate -> rotate -> scale
    const translateIdx = transform.indexOf('translate');
    const rotateIdx = transform.indexOf('rotate');
    const scaleIdx = transform.indexOf('scale');

    expect(translateIdx).toBeGreaterThanOrEqual(0);
    expect(rotateIdx).toBeGreaterThan(translateIdx);
    expect(scaleIdx).toBeGreaterThan(rotateIdx);
  });
});

test.describe('Tween.from()', () => {
  test('should animate from specified value to current', async ({ page }) => {
    // Set initial opacity to 1 (default), animate from 0
    await page.evaluate(() => {
      const { Tween, linear } = window.__turboTween!;
      const box = document.getElementById('box')!;
      box.style.opacity = '1';
      Tween.from(box, 400, { opacity: 0, ease: linear });
    });

    // Near the start, opacity should be close to 0
    await page.waitForTimeout(50);
    const earlyOpacity = await page
      .locator('#box')
      .evaluate((el) => parseFloat(getComputedStyle(el).opacity));
    expect(earlyOpacity).toBeLessThan(0.5);

    // At the end, opacity should be back to 1
    await page.waitForTimeout(450);
    const finalOpacity = await page
      .locator('#box')
      .evaluate((el) => parseFloat(getComputedStyle(el).opacity));
    expect(finalOpacity).toBeCloseTo(1, 1);
  });
});

test.describe('Tween.fromTo()', () => {
  test('should animate between explicit start and end', async ({ page }) => {
    await page.evaluate(() => {
      const { Tween, linear } = window.__turboTween!;
      const box = document.getElementById('box')!;
      Tween.fromTo(box, 400, { opacity: 0.1 }, { opacity: 0.9, ease: linear });
    });

    await page.waitForTimeout(500);

    const opacity = await page
      .locator('#box')
      .evaluate((el) => parseFloat(getComputedStyle(el).opacity));
    expect(opacity).toBeCloseTo(0.9, 1);
  });
});

test.describe('Playback control', () => {
  test('pause should freeze the animation', async ({ page }) => {
    const pausedValue = await page.evaluate(async () => {
      const { Tween, linear } = window.__turboTween!;
      const box = document.getElementById('box')!;
      const tween = Tween.to(box, 2000, { x: 400, ease: linear });

      await new Promise((r) => setTimeout(r, 200));
      tween.pause();
      const transform1 = box.style.transform;

      await new Promise((r) => setTimeout(r, 300));
      const transform2 = box.style.transform;

      return { transform1, transform2 };
    });

    // Transforms should be identical after pause
    expect(pausedValue.transform1).toBe(pausedValue.transform2);
  });

  test('seek should jump to specific time', async ({ page }) => {
    await page.evaluate(() => {
      const { Tween, linear } = window.__turboTween!;
      const box = document.getElementById('box')!;
      const tween = Tween.to(box, 1000, { x: 200, ease: linear });
      tween.pause();
      tween.seek(500);
    });

    const transform = await page.locator('#box').evaluate((el) => el.style.transform);
    expect(transform).toContain('translate');
    // At 50% of 200px = ~100px
    const match = transform.match(/translate\(([^p]+)px/);
    expect(match).toBeTruthy();
    const translateX = match?.[1];
    expect(translateX).toBeTruthy();
    if (!translateX) {
      throw new Error('Expected translate capture');
    }
    expect(parseFloat(translateX)).toBeCloseTo(100, -1);
  });

  test('kill should stop the animation', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { Tween, linear } = window.__turboTween!;
      const box = document.getElementById('box')!;
      const tween = Tween.to(box, 2000, { x: 400, ease: linear });

      await new Promise((r) => setTimeout(r, 100));
      tween.kill();
      const transformAtKill = box.style.transform;

      await new Promise((r) => setTimeout(r, 300));
      const transformLater = box.style.transform;

      return { transformAtKill, transformLater };
    });

    expect(result.transformAtKill).toBe(result.transformLater);
  });
});

test.describe('Awaitable tween', () => {
  test('should resolve the promise on completion', async ({ page }) => {
    const completed = await page.evaluate(async () => {
      const { Tween, linear } = window.__turboTween!;
      const box = document.getElementById('box')!;
      await Tween.to(box, 200, { x: 50, ease: linear });
      return true;
    });

    expect(completed).toBe(true);
  });
});

test.describe('Timeline', () => {
  test('should sequence tweens in order', async ({ page }) => {
    await page.evaluate(async () => {
      const { Timeline, linear } = window.__turboTween!;
      const box = document.getElementById('box')!;

      const tl = new Timeline();
      tl.to(box, 300, { x: 100, ease: linear }).to(box, 300, { y: 100, ease: linear });
      tl.play();

      // Wait for both to complete
      await new Promise((r) => setTimeout(r, 700));
    });

    const transform = await page.locator('#box').evaluate((el) => el.style.transform);
    expect(transform).toContain('100px');
  });

  test('should support seek for instant positioning', async ({ page }) => {
    await page.evaluate(() => {
      const { Timeline, linear } = window.__turboTween!;
      const box = document.getElementById('box')!;

      const tl = new Timeline();
      tl.to(box, 500, { x: 200, ease: linear });
      tl.seek(250);
    });

    const transform = await page.locator('#box').evaluate((el) => el.style.transform);
    // At 50% of 200 = 100px
    const match = transform.match(/translate\(([^p]+)px/);
    expect(match).toBeTruthy();
    const translateX = match?.[1];
    expect(translateX).toBeTruthy();
    if (!translateX) {
      throw new Error('Expected translate capture');
    }
    expect(parseFloat(translateX)).toBeCloseTo(100, -1);
  });

  test('staggerTo should animate elements with delays', async ({ page }) => {
    await page.evaluate(async () => {
      const { Timeline, stagger, linear } = window.__turboTween!;
      const items = document.querySelectorAll('.stagger-item');

      const tl = new Timeline();
      tl.staggerTo([...items], 300, { opacity: 1, ease: linear }, stagger(100));
      tl.play();

      // Wait for all to complete
      await new Promise((r) => setTimeout(r, 900));
    });

    // All items should have opacity 1
    for (let i = 0; i < 5; i++) {
      const opacity = await page
        .locator(`[data-testid="stagger-${i}"]`)
        .evaluate((el) => parseFloat(getComputedStyle(el).opacity));
      expect(opacity).toBeCloseTo(1, 1);
    }
  });
});

test.describe('Color animation', () => {
  test('should interpolate background colors', async ({ page }) => {
    await page.evaluate(async () => {
      const { Tween, linear } = window.__turboTween!;
      const box = document.getElementById('color-box')!;
      await Tween.to(box, 300, {
        backgroundColor: 'rgb(0, 0, 255)',
        ease: linear,
      });
    });

    const bg = await page
      .locator('#color-box')
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    // Should be blue: rgb(0, 0, 255)
    expect(bg).toContain('0');
    expect(bg).toContain('255');
  });
});

test.describe('Overwrite modes', () => {
  test('overwrite "all" should kill previous tweens on same target', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { Tween, linear } = window.__turboTween!;
      const box = document.getElementById('box')!;

      // Start a long tween
      Tween.to(box, 5000, { x: 500, ease: linear });

      // Immediately overwrite with a new one
      await Tween.to(box, 300, { x: 50, ease: linear, overwrite: 'all' });

      return box.style.transform;
    });

    // Should have ended at x=50, not x=500
    const match = result.match(/translate\(([^p]+)px/);
    expect(match).toBeTruthy();
    const translateX = match?.[1];
    expect(translateX).toBeTruthy();
    if (!translateX) {
      throw new Error('Expected translate capture');
    }
    expect(parseFloat(translateX)).toBeCloseTo(50, -1);
  });
});

test.describe('Plain object animation', () => {
  test('should animate a plain JavaScript object', async ({ page }) => {
    const finalValue = await page.evaluate(async () => {
      const { Tween, linear } = window.__turboTween!;
      const camera = { posX: 0, posY: 0, zoom: 1 };
      await Tween.to(camera, 300, { posX: 100, posY: 50, zoom: 2, ease: linear });
      return camera;
    });

    expect(finalValue.posX).toBeCloseTo(100, 0);
    expect(finalValue.posY).toBeCloseTo(50, 0);
    expect(finalValue.zoom).toBeCloseTo(2, 0);
  });
});

test.describe('GPU acceleration', () => {
  test('should use translate3d when z is specified', async ({ page }) => {
    await page.evaluate(() => {
      const { Tween, linear } = window.__turboTween!;
      const box = document.getElementById('box')!;
      const tween = Tween.to(box, 400, { x: 100, z: 50, ease: linear });
      tween.pause();
      tween.seek(400);
    });

    const transform = await page.locator('#box').evaluate((el) => el.style.transform);
    expect(transform).toContain('translate3d');
  });
});

test.describe('Delay', () => {
  test('should not start animating during the delay period', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { Tween, linear } = window.__turboTween!;
      const box = document.getElementById('box')!;
      Tween.to(box, 300, { x: 200, ease: linear, delay: 500 });

      await new Promise((r) => setTimeout(r, 100));
      return box.style.transform;
    });

    // During delay, transform should be empty or 'none' or translate(0, 0)
    const hasNoMovement = result === '' || result === 'none' || result.includes('translate(0px');
    expect(hasNoMovement).toBe(true);
  });
});
