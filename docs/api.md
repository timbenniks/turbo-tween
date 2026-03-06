# API Reference

Complete reference for every function, type, option, and adapter in Turbo-Tween.

---

## Core API

The `Tween` object is the primary entry point. It is a singleton backed by a default `TweenEngine` and a shared `requestAnimationFrame` clock. All methods return a `TweenInstance` with full playback control and `await` support.

```ts
import { Tween, quadOut } from 'turbo-tween';
```

---

### `Tween.to(target, duration, options)`

Animate one or more properties from their **current values** to the values you specify. This is the most common method in any animation workflow.

**Signature:**

```ts
Tween.to(
  target: HTMLElement | Record<string, unknown>,
  duration: number,
  options?: TweenOptions,
): TweenInstance
```

**Parameters:**

| Parameter  | Type                                     | Description                                                                                                     |
| ---------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `target`   | `HTMLElement \| Record<string, unknown>` | The DOM element or plain object to animate. Can also be any object with a `style` property.                     |
| `duration` | `number`                                 | Duration in **milliseconds**. A value of `0` completes instantly.                                               |
| `options`  | `TweenOptions`                           | Properties to animate, plus optional configuration (ease, delay, callbacks). See [TweenOptions](#tweenoptions). |

**Returns:** `TweenInstance` -- a controllable, awaitable tween handle.

**Examples:**

Animate a DOM element with easing:

```ts
const el = document.querySelector('.box')!;
Tween.to(el, 1000, { x: 200, opacity: 0.5, ease: quadOut });
```

Animate a plain object (useful for canvas, WebGL, or game state):

```ts
const camera = { x: 0, y: 0, zoom: 1 };

Tween.to(camera, 2000, {
  x: 500,
  zoom: 2.5,
  onUpdate: () => renderScene(camera),
});
```

Await completion before running the next step:

```ts
await Tween.to(el, 600, { y: -20, ease: backOut });
await Tween.to(el, 400, { y: 0, ease: bounceOut });
```

---

### `Tween.from(target, duration, options)`

Animate properties **from** the values you specify **to** their current values. The element is immediately set to the `from` state on creation, then animates toward whatever the target's properties were before the tween was created.

This is ideal for entrance animations where you want the element to end at its natural position.

**Signature:**

```ts
Tween.from(
  target: HTMLElement | Record<string, unknown>,
  duration: number,
  options?: TweenOptions,
): TweenInstance
```

**Parameters:** Same shape as `Tween.to()`. The numeric/CSS properties in `options` are interpreted as **starting** values rather than ending values.

**Returns:** `TweenInstance`

**How current values are captured:** When `from()` is called, Turbo-Tween reads the target's current property values (via `getComputedStyle` for DOM elements, or direct property access for plain objects). These captured values become the end state. The values you pass in `options` become the start state, and the target is immediately set to those start values before the first frame.

**Example -- entrance animation:**

```ts
// The heading is at opacity: 1, y: 0 in CSS.
// This animates FROM opacity: 0, y: -30 TO those natural values.
Tween.from(heading, 800, {
  opacity: 0,
  y: -30,
  ease: cubicOut,
});
```

---

### `Tween.fromTo(target, duration, fromVars, toVars)`

Animate between **explicit** start and end values. Use this when you need full control over both ends of the animation and do not want Turbo-Tween to read current values at all.

**Signature:**

```ts
Tween.fromTo(
  target: HTMLElement | Record<string, unknown>,
  duration: number,
  fromVars: Record<string, unknown>,
  toVars?: TweenOptions,
): TweenInstance
```

**Parameters:**

| Parameter  | Type                                     | Description                                                |
| ---------- | ---------------------------------------- | ---------------------------------------------------------- |
| `target`   | `HTMLElement \| Record<string, unknown>` | The element or object to animate.                          |
| `duration` | `number`                                 | Duration in milliseconds.                                  |
| `fromVars` | `Record<string, unknown>`                | Starting values for each property.                         |
| `toVars`   | `TweenOptions`                           | Ending values plus configuration (ease, delay, callbacks). |

**Returns:** `TweenInstance`

**When to use `fromTo` vs `to`/`from`:**

- Use `to()` when the element is already in its starting state and you only care about where it ends.
- Use `from()` when the element is already in its ending state (its natural DOM position) and you want to define where it comes from.
- Use `fromTo()` when you need deterministic start and end values regardless of current state -- for example, a looping animation or an animation that might be triggered while another is still running.

**Example -- explicit range:**

```ts
Tween.fromTo(el, 1200, { x: -100, rotation: -45 }, { x: 100, rotation: 45, ease: backInOut });
```

---

### `Tween.killAll()`

Kill every active tween managed by the default engine. All tweens are stopped immediately, their promises are resolved, and they are removed from the engine.

**Signature:**

```ts
Tween.killAll(): void
```

**When to use:** Page transitions, route changes, or any moment you need a clean slate.

**Example:**

```ts
// Before navigating to a new page
Tween.killAll();
router.push('/next');
```

---

### `Tween.killTweensOf(target)`

Kill all tweens targeting a specific element or object. Other tweens continue running.

**Signature:**

```ts
Tween.killTweensOf(target: HTMLElement | Record<string, unknown>): void
```

**When to use:** Rapid user interactions (hover, click, scroll) where a new animation should cancel any in-progress animation on the same target.

**Example -- preventing animation buildup on hover:**

```ts
const card = document.querySelector('.card')!;

card.addEventListener('mouseenter', () => {
  Tween.killTweensOf(card);
  Tween.to(card, 300, { scale: 1.05, ease: quadOut });
});

card.addEventListener('mouseleave', () => {
  Tween.killTweensOf(card);
  Tween.to(card, 300, { scale: 1, ease: quadOut });
});
```

---

## TweenOptions

The options object passed to `to()`, `from()`, and `fromTo()`. It contains both configuration keys and the properties you want to animate. Reserved keys are used for configuration and are **not** animated.

```ts
interface TweenOptions {
  delay?: number;
  ease?: EasingFunction;
  overwrite?: 'auto' | 'all' | 'none';
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
  onReverseComplete?: () => void;
  [key: string]: unknown;
}
```

### Full property table

| Property            | Type                         | Default                                 | Description                                                                                                                                                                                                                                                                                                              |
| ------------------- | ---------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `delay`             | `number`                     | `0`                                     | Time in milliseconds to wait before the tween begins. The delay is applied once; callbacks and progress do not fire during the delay.                                                                                                                                                                                    |
| `ease`              | `EasingFunction`             | `linear` (resolved via `resolveEasing`) | An easing function `(t: number) => number`. If not provided, the tween resolves to `linear`. The `quadOut` easing is a common choice for UI animations.                                                                                                                                                                  |
| `overwrite`         | `'auto' \| 'all' \| 'none'`  | `'none'`                                | Controls how conflicting tweens on the same target are handled. See [Overwrite Modes](#overwrite-modes).                                                                                                                                                                                                                 |
| `onStart`           | `() => void`                 | --                                      | Fires once when the tween's first real frame runs (after any delay has elapsed).                                                                                                                                                                                                                                         |
| `onUpdate`          | `(progress: number) => void` | --                                      | Fires every frame with the current eased progress value (0 to 1, though elastic/back easings can overshoot).                                                                                                                                                                                                             |
| `onComplete`        | `() => void`                 | --                                      | Fires when the tween reaches its forward end. Also fires before the internal promise resolves. Does not fire for reverse completion.                                                                                                                                                                                     |
| `onReverseComplete` | `() => void`                 | --                                      | Fires when a reversed tween reaches its starting point (progress returns to 0).                                                                                                                                                                                                                                          |
| `[key: string]`     | `number \| string`           | --                                      | Any other key is treated as a property to animate. For DOM elements, this can be a CSS property (`opacity`, `width`, etc.), a color (`backgroundColor`, `color`), or a [transform shorthand](#transform-shorthands) (`x`, `y`, `scale`, `rotation`). For plain objects, it animates the named numeric property directly. |

**Reserved keys** (`delay`, `ease`, `overwrite`, `onStart`, `onUpdate`, `onComplete`, `onReverseComplete`) are stripped from the property list and never treated as values to animate.

---

## TweenInstance

Every call to `Tween.to()`, `Tween.from()`, or `Tween.fromTo()` returns a `TweenInstance`. This object provides full playback control and state inspection.

### Methods

All control methods return `this` (except `kill()`), enabling chaining.

| Method      | Signature              | Returns         | Description                                                                                                                                                     |
| ----------- | ---------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pause()`   | `pause()`              | `TweenInstance` | Freezes the tween at its current progress. Has no effect if already paused or inactive.                                                                         |
| `resume()`  | `resume()`             | `TweenInstance` | Resumes playback from the paused position. Has no effect if not paused. Paused wall-time is not counted toward progress.                                        |
| `reverse()` | `reverse()`            | `TweenInstance` | Toggles the playback direction. If the tween was complete, it re-enters the engine and plays backward from the end. Calling `reverse()` again flips it forward. |
| `seek()`    | `seek(timeMs: number)` | `TweenInstance` | Jumps to a specific time (in milliseconds). Immediately applies the interpolated values and fires `onUpdate`. Does not affect play/pause state.                 |
| `kill()`    | `kill()`               | `void`          | Stops the tween, removes it from the engine, and resolves the internal promise. The tween cannot be resumed after being killed.                                 |

### Properties

All properties are read-only.

| Property      | Type      | Description                                                                                                   |
| ------------- | --------- | ------------------------------------------------------------------------------------------------------------- |
| `progress`    | `number`  | Current **eased** progress. Typically 0 to 1, but can go below 0 or above 1 with `back` or `elastic` easings. |
| `isActive`    | `boolean` | `true` while the tween is alive and managed by the engine. Becomes `false` when complete or killed.           |
| `isPaused`    | `boolean` | `true` when `pause()` has been called and `resume()` has not yet been called.                                 |
| `isReversed`  | `boolean` | `true` when the tween is playing in reverse.                                                                  |
| `duration`    | `number`  | Total duration in milliseconds (the value passed at creation).                                                |
| `currentTime` | `number`  | Elapsed time in milliseconds since the tween started (excluding delay).                                       |

### Thenable (await support)

`TweenInstance` implements a `.then()` method, making it a valid thenable. You can use it directly with `await` or `.then()` chains without wrapping it in a `Promise`.

```ts
// Using await
await Tween.to(el, 1000, { x: 100 });
console.log('done');

// Using .then()
Tween.to(el, 1000, { x: 100 }).then(() => {
  console.log('done');
});
```

The promise resolves when the tween completes naturally or when `kill()` is called. It never rejects.

### Method chaining

Control methods return `this`, so you can chain them:

```ts
const tween = Tween.to(el, 2000, { x: 300 });
tween.pause().reverse();
```

### Example: interactive animation with pause on hover

```ts
const tween = Tween.to(el, 3000, { x: 400, ease: linear });

el.addEventListener('mouseenter', () => tween.pause());
el.addEventListener('mouseleave', () => tween.resume());
```

---

## Timeline

`Timeline` sequences multiple tweens into a coordinated animation with shared playback control. Each tween added to the timeline starts where the previous one ended (the **cursor model**).

```ts
import { Timeline, quadOut, stagger } from 'turbo-tween';
```

### Constructor

```ts
new Timeline(options?: TimelineOptions)
```

**TimelineOptions:**

| Property            | Type             | Default | Description                                                                                                            |
| ------------------- | ---------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `defaults.duration` | `number`         | `500`   | Default duration applied to child tweens that omit the `duration` parameter.                                           |
| `defaults.ease`     | `EasingFunction` | --      | Default easing applied to child tweens that omit the `ease` option.                                                    |
| `autoPlay`          | `boolean`        | `false` | If `true`, playback starts automatically via a microtask (allowing you to chain `.to()` calls before the first frame). |

### Methods

All tween-adding methods (`to`, `from`, `fromTo`, `staggerTo`) return the `Timeline` instance for chaining. Playback methods also return `this`.

| Method        | Signature                                          | Returns    | Description                                                                                                              |
| ------------- | -------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `to()`        | `to(target, duration?, options?)`                  | `Timeline` | Adds a `to()` tween starting at the current cursor position. The cursor advances by `duration`.                          |
| `from()`      | `from(target, duration?, options?)`                | `Timeline` | Adds a `from()` tween at the cursor. The cursor advances by `duration`.                                                  |
| `fromTo()`    | `fromTo(target, duration, fromVars, toVars?)`      | `Timeline` | Adds a `fromTo()` tween at the cursor. The cursor advances by `duration`.                                                |
| `staggerTo()` | `staggerTo(targets, duration, options, staggerFn)` | `Timeline` | Adds one `to()` tween per target with staggered start times. The cursor advances to the end of the last staggered tween. |
| `play()`      | `play()`                                           | `Timeline` | Starts (or restarts) playback driven by `requestAnimationFrame`.                                                         |
| `pause()`     | `pause()`                                          | `Timeline` | Freezes playback at the current position.                                                                                |
| `resume()`    | `resume()`                                         | `Timeline` | Resumes from a paused state. If not currently playing, calls `play()`.                                                   |
| `reverse()`   | `reverse()`                                        | `Timeline` | Toggles direction. When reversed, `play()` runs the timeline backward.                                                   |
| `seek()`      | `seek(timeMs: number)`                             | `Timeline` | Jumps to a specific time. All child tweens are updated to reflect that point. Does not start or stop RAF playback.       |
| `tick()`      | `tick(deltaMs: number)`                            | `void`     | Manually advance the timeline by `deltaMs`. Intended for testing or server-driven scenarios where you control the clock. |
| `kill()`      | `kill()`                                           | `void`     | Stops playback, kills all child tweens, clears entries, and resolves the timeline's promise.                             |

### Properties

| Property     | Type      | Description                                                                     |
| ------------ | --------- | ------------------------------------------------------------------------------- |
| `progress`   | `number`  | 0 to 1, representing position within the total duration.                        |
| `isPaused`   | `boolean` | Whether the timeline is currently paused.                                       |
| `isReversed` | `boolean` | Whether the timeline is playing in reverse.                                     |
| `isPlaying`  | `boolean` | Whether RAF is actively driving playback.                                       |
| `duration`   | `number`  | Total computed duration in milliseconds (sum of all sequenced child durations). |

### Thenable

Timelines implement `.then()` and can be `await`ed. The promise resolves when playback reaches the end (or the start, if reversed).

```ts
const tl = new Timeline();
tl.to(el, 500, { x: 100 }).to(el, 500, { y: 200 });
tl.play();
await tl;
console.log('timeline finished');
```

### The cursor model

Each call to `.to()`, `.from()`, or `.fromTo()` places its tween at the cursor and then advances the cursor by the tween's duration. This means tweens play one after another, in the order they were added.

```
Timeline cursor:  0ms      500ms     1000ms    1500ms
                  |--- A ---|--- B ---|--- C ---|
```

`staggerTo()` is a special case: it places multiple tweens starting at the cursor, offset by the stagger function, and advances the cursor to the latest end time.

### Detailed example: multi-step intro animation

```ts
import { Timeline, cubicOut, backOut, stagger } from 'turbo-tween';

const heading = document.querySelector('h1')!;
const paragraph = document.querySelector('p')!;
const buttons = document.querySelectorAll('.btn');

const tl = new Timeline({ defaults: { ease: cubicOut } });

tl.from(heading, 600, { opacity: 0, y: -40 })
  .from(paragraph, 500, { opacity: 0, y: 20 })
  .staggerTo(
    Array.from(buttons),
    400,
    { opacity: 1, y: 0, ease: backOut },
    stagger(80, { from: 'start' }),
  );

tl.play();
await tl;
console.log('intro complete');
```

---

## stagger(amount, config?)

Creates a stagger function for use with `Timeline.staggerTo()`. The returned function computes a per-element delay based on its index and the total count.

**Signature:**

```ts
function stagger(amount: number, config?: StaggerConfig): (index: number, total: number) => number;
```

**Parameters:**

| Parameter     | Type                                     | Default   | Description                                                                                                               |
| ------------- | ---------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------- |
| `amount`      | `number`                                 | --        | Base delay spread in milliseconds. The actual delay per element is calculated as `ease(position) * amount * (total - 1)`. |
| `config.from` | `'start' \| 'center' \| 'end' \| number` | `'start'` | The origin point from which delays radiate.                                                                               |
| `config.ease` | `EasingFunction`                         | `linear`  | Easing applied to the delay distribution. Affects how delays are spread, not the animation easing.                        |

**Returns:** `(index: number, total: number) => number` -- a function that computes the delay for a given element.

### How delays are calculated

Given 5 elements (`total = 5`) and `amount = 200`:

**`from: 'start'` (default):**

```
Index:  0     1     2     3     4
Delay:  0ms   200ms 400ms 600ms 800ms
```

Each element's position is `index / (total - 1)`, so delays increase linearly from the first element.

**`from: 'end'`:**

```
Index:  0     1     2     3     4
Delay:  800ms 600ms 400ms 200ms 0ms
```

The reverse: position is `(total - 1 - index) / (total - 1)`.

**`from: 'center'`:**

```
Index:  0     1     2     3     4
Delay:  800ms 400ms 0ms   400ms 800ms
```

Position is the absolute distance from the center, normalized. Elements at the center start first; edges start last.

**`from: 2` (specific index):**

```
Index:  0     1     2     3     4
Delay:  800ms 400ms 0ms   400ms 800ms
```

Same concept as center, but radiates from the specified index. If you pass `from: 0`, the result is identical to `'start'`.

### Examples

```ts
// Linear stagger from start
stagger(100);
// => delays: 0, 100, 200, 300, ...

// Stagger from the end
stagger(100, { from: 'end' });
// => delays: ...300, 200, 100, 0

// Radiate from center
stagger(100, { from: 'center' });
// => edges get the most delay, center starts first

// Radiate from a specific element
stagger(100, { from: 2 });
// => index 2 starts first, others are delayed by distance

// With easing: cluster delays toward the start
stagger(200, { ease: quadIn });
// => early elements are closely spaced, later ones more spread out
```

---

## TweenEngine

For advanced use cases you can create an isolated engine instance. Each engine manages its own set of tweens independently from the global `Tween` singleton.

**When to use:**

- **Isolated animation scopes** -- a component or module that should not interfere with global tweens.
- **Testing** -- create an engine with a manual clock to control time precisely.
- **Multiple independent systems** -- e.g., a UI animation layer and a particle system that run independently.

### Constructor

```ts
import { TweenEngine } from 'turbo-tween';

const engine = new TweenEngine(clock?: Clock);
```

If no `Clock` is provided, the engine uses the default RAF-based clock shared by the `Tween` singleton. Pass a custom `Clock` for manual control.

### Methods

| Method           | Signature                                     | Returns         | Description                                   |
| ---------------- | --------------------------------------------- | --------------- | --------------------------------------------- |
| `to()`           | `to(target, duration, options?)`              | `TweenInstance` | Same as `Tween.to()`.                         |
| `from()`         | `from(target, duration, options?)`            | `TweenInstance` | Same as `Tween.from()`.                       |
| `fromTo()`       | `fromTo(target, duration, fromVars, toVars?)` | `TweenInstance` | Same as `Tween.fromTo()`.                     |
| `killAll()`      | `killAll()`                                   | `void`          | Kills all tweens managed by this engine.      |
| `killTweensOf()` | `killTweensOf(target)`                        | `void`          | Kills all tweens targeting a specific object. |

### Properties

| Property      | Type     | Description                                           |
| ------------- | -------- | ----------------------------------------------------- |
| `activeCount` | `number` | The number of currently active tweens in this engine. |

### Example

```ts
import { TweenEngine } from 'turbo-tween';

const engine = new TweenEngine();

engine.to(target, 1000, { value: 100 });
console.log(engine.activeCount); // 1

engine.killAll();
console.log(engine.activeCount); // 0
```

---

## Easings

All easing functions follow the normalized signature `(t: number) => number`, where `t` ranges from 0 to 1 (representing progress from start to end). The return value is typically 0 to 1, but some families overshoot.

```ts
import { quadOut, backIn, elasticOut } from 'turbo-tween';
import type { EasingFunction } from 'turbo-tween';
```

### Full list

| Family      | In          | Out          | InOut          |
| ----------- | ----------- | ------------ | -------------- |
| **Linear**  | `linear`    | --           | --             |
| **Quad**    | `quadIn`    | `quadOut`    | `quadInOut`    |
| **Cubic**   | `cubicIn`   | `cubicOut`   | `cubicInOut`   |
| **Quart**   | `quartIn`   | `quartOut`   | `quartInOut`   |
| **Quint**   | `quintIn`   | `quintOut`   | `quintInOut`   |
| **Sine**    | `sineIn`    | `sineOut`    | `sineInOut`    |
| **Expo**    | `expoIn`    | `expoOut`    | `expoInOut`    |
| **Circ**    | `circIn`    | `circOut`    | `circInOut`    |
| **Back**    | `backIn`    | `backOut`    | `backInOut`    |
| **Elastic** | `elasticIn` | `elasticOut` | `elasticInOut` |
| **Bounce**  | `bounceIn`  | `bounceOut`  | `bounceInOut`  |

**Total: 31 functions** (including `linear`).

### Overshooting easings

Most easing functions stay within 0 to 1. The following families can produce values **below 0** or **above 1**:

| Family      | Behavior                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------- |
| **Back**    | Overshoots the target slightly, then settles. `backIn` dips below 0 near the start; `backOut` exceeds 1 near the end. |
| **Elastic** | Oscillates around the target with spring-like motion. Can produce values significantly below 0 or above 1.            |

This matters if you are using eased values directly (e.g., clamping a color channel). Standard CSS properties like `opacity` are naturally clamped by the browser, but custom values may need manual clamping.

### Custom easings

Any function matching `(t: number) => number` works as an easing:

```ts
import type { EasingFunction } from 'turbo-tween';

// Cubic ease-out (manual implementation)
const myCubicOut: EasingFunction = (t) => 1 - Math.pow(1 - t, 3);

// Steps easing (4 discrete steps)
const steps: EasingFunction = (t) => Math.floor(t * 4) / 4;

// Spring-like custom easing
const spring: EasingFunction = (t) => {
  const s = 1 - t;
  return 1 - (Math.pow(s, 3) - s * Math.sin(s * Math.PI)) / 1;
};

Tween.to(el, 1000, { x: 200, ease: myCubicOut });
```

### When to use which family

| Goal                                             | Recommended easing       |
| ------------------------------------------------ | ------------------------ |
| General UI transitions (menus, modals, tooltips) | `quadOut`, `cubicOut`    |
| Smooth symmetric transitions                     | `sineInOut`, `quadInOut` |
| Dramatic entrances                               | `backOut`, `elasticOut`  |
| Bouncy, playful motion                           | `bounceOut`              |
| Elements entering from off-screen                | `expoOut`, `quintOut`    |
| Loading bars, linear motion                      | `linear`                 |
| Physical / spring-like settling                  | `elasticOut`             |
| Symmetrical emphasis (scale pulse, etc.)         | `backInOut`              |

---

## Vue Adapter (`turbo-tween/vue`)

```ts
import { useTween, TweenTo, TweenFrom, TweenFromTo, TweenTimeline } from 'turbo-tween/vue';
```

---

### `useTween()` composable

Creates a scoped `TweenEngine` tied to the component lifecycle. When the component unmounts, all tweens created through this composable are automatically killed. No manual cleanup needed.

**Return type:**

| Property       | Type                                                                                                                      | Description                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `to`           | `(target: AnimatableTarget, duration: number, options?: TweenOptions) => TweenInstance`                                   | Same as `Tween.to()`, scoped to this component.                                                                                |
| `from`         | `(target: AnimatableTarget, duration: number, options?: TweenOptions) => TweenInstance`                                   | Same as `Tween.from()`, scoped to this component.                                                                              |
| `fromTo`       | `(target: AnimatableTarget, duration: number, fromVars: Record<string, unknown>, toVars?: TweenOptions) => TweenInstance` | Same as `Tween.fromTo()`, scoped to this component.                                                                            |
| `killAll`      | `() => void`                                                                                                              | Kill all tweens created by this composable.                                                                                    |
| `killTweensOf` | `(target: AnimatableTarget) => void`                                                                                      | Kill tweens for a specific target within this scope.                                                                           |
| `isAnimating`  | `Readonly<Ref<boolean>>`                                                                                                  | Reactive boolean. `true` when at least one tween in this scope is active. Updates automatically when tweens start or complete. |

**Example:**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTween } from 'turbo-tween/vue';
import { cubicOut } from 'turbo-tween';

const boxRef = ref<HTMLElement | null>(null);
const { to, isAnimating } = useTween();

onMounted(() => {
  if (boxRef.value) {
    to(boxRef.value, 1000, { x: 200, rotation: 90, ease: cubicOut });
  }
});
</script>

<template>
  <div ref="boxRef" class="box" />
  <p v-if="isAnimating">Animating...</p>
</template>
```

**Auto-cleanup behavior:** The composable calls `engine.killAll()` inside an `onUnmounted` hook. If the component instance is not available (e.g., called outside of `setup()`), the cleanup hook is not registered, and you are responsible for calling `killAll()` yourself.

---

### Declarative Components

All declarative components wrap their slot content and apply animation to the root element of that slot. If the component is nested inside a `<TweenTimeline>`, it registers itself with the timeline via `provide`/`inject` instead of playing immediately.

---

#### `<TweenTo>`

Animates the child element's properties **to** the specified values on mount.

**Props:**

| Prop       | Type                      | Default     | Required | Description                    |
| ---------- | ------------------------- | ----------- | -------- | ------------------------------ |
| `duration` | `number`                  | `500`       | No       | Duration in milliseconds.      |
| `to`       | `Record<string, unknown>` | --          | Yes      | Target property values.        |
| `ease`     | `EasingFunction`          | `undefined` | No       | Easing function.               |
| `delay`    | `number`                  | `0`         | No       | Delay before animation starts. |

**Example:**

```vue
<template>
  <TweenTo :duration="800" :to="{ x: 200, opacity: 1 }" :ease="quadOut">
    <div class="card">Hello</div>
  </TweenTo>
</template>
```

---

#### `<TweenFrom>`

Animates the child element **from** the specified values to its current values on mount.

**Props:**

| Prop       | Type                      | Default     | Required | Description                    |
| ---------- | ------------------------- | ----------- | -------- | ------------------------------ |
| `duration` | `number`                  | `500`       | No       | Duration in milliseconds.      |
| `from`     | `Record<string, unknown>` | --          | Yes      | Starting property values.      |
| `ease`     | `EasingFunction`          | `undefined` | No       | Easing function.               |
| `delay`    | `number`                  | `0`         | No       | Delay before animation starts. |

**Example:**

```vue
<template>
  <TweenFrom :duration="600" :from="{ opacity: 0, y: -30 }" :ease="cubicOut">
    <h1>Welcome</h1>
  </TweenFrom>
</template>
```

---

#### `<TweenFromTo>`

Animates the child element between explicit start and end values on mount.

**Props:**

| Prop       | Type                      | Default     | Required | Description                    |
| ---------- | ------------------------- | ----------- | -------- | ------------------------------ |
| `duration` | `number`                  | `500`       | No       | Duration in milliseconds.      |
| `from`     | `Record<string, unknown>` | --          | Yes      | Starting property values.      |
| `to`       | `Record<string, unknown>` | --          | Yes      | Ending property values.        |
| `ease`     | `EasingFunction`          | `undefined` | No       | Easing function.               |
| `delay`    | `number`                  | `0`         | No       | Delay before animation starts. |

**Example:**

```vue
<template>
  <TweenFromTo
    :duration="1000"
    :from="{ x: -100, opacity: 0 }"
    :to="{ x: 0, opacity: 1 }"
    :ease="backOut"
  >
    <div class="panel">Content</div>
  </TweenFromTo>
</template>
```

---

#### `<TweenTimeline>`

Orchestrates child `<TweenTo>`, `<TweenFrom>`, and `<TweenFromTo>` components into a sequenced timeline. Children register themselves via Vue's `provide`/`inject` mechanism using the `TIMELINE_KEY` injection key. The timeline is constructed on mount by iterating registered entries in order.

**Props:**

| Prop       | Type                                           | Default     | Description                                     |
| ---------- | ---------------------------------------------- | ----------- | ----------------------------------------------- |
| `autoPlay` | `boolean`                                      | `true`      | Whether to start playback immediately on mount. |
| `defaults` | `{ duration?: number; ease?: EasingFunction }` | `undefined` | Default duration and easing for child tweens.   |

**Events:**

| Event       | Payload | Description                                                                                       |
| ----------- | ------- | ------------------------------------------------------------------------------------------------- |
| `@complete` | none    | Emitted when the timeline finishes playing (only if `autoPlay` is `true` or `play()` was called). |

**Exposed ref methods:**

Access these via a template ref on the component:

| Method          | Description                                                          |
| --------------- | -------------------------------------------------------------------- |
| `play()`        | Start timeline playback.                                             |
| `pause()`       | Pause playback.                                                      |
| `resume()`      | Resume playback.                                                     |
| `reverse()`     | Toggle playback direction.                                           |
| `seek(timeMs)`  | Jump to a specific time.                                             |
| `kill()`        | Stop and clean up the timeline.                                      |
| `getTimeline()` | Returns the underlying `Timeline` instance (or `null` before mount). |

**Example with sequenced children:**

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { TweenTimeline, TweenFrom, TweenTo } from 'turbo-tween/vue';
import { cubicOut, backOut } from 'turbo-tween';

const tlRef = ref<InstanceType<typeof TweenTimeline> | null>(null);

function replay() {
  tlRef.value?.seek(0);
  tlRef.value?.play();
}
</script>

<template>
  <TweenTimeline
    ref="tlRef"
    :auto-play="true"
    :defaults="{ ease: cubicOut }"
    @complete="console.log('done')"
  >
    <TweenFrom :duration="600" :from="{ opacity: 0, y: -40 }">
      <h1>Title</h1>
    </TweenFrom>

    <TweenFrom :duration="500" :from="{ opacity: 0, y: 20 }">
      <p>Subtitle text</p>
    </TweenFrom>

    <TweenTo :duration="400" :to="{ scale: 1, opacity: 1 }" :ease="backOut">
      <button class="cta">Get Started</button>
    </TweenTo>
  </TweenTimeline>

  <button @click="replay">Replay</button>
</template>
```

**How children register:** When a `<TweenTo>`, `<TweenFrom>`, or `<TweenFromTo>` component detects the `TIMELINE_KEY` injection (provided by `<TweenTimeline>`), it registers its configuration (mode, target getter, duration, options) with the timeline instead of creating its own tween. On mount, `<TweenTimeline>` iterates all registered entries and adds them to a `Timeline` instance in registration order.

---

## React Adapter (`turbo-tween/react`)

```tsx
import { useTween, TweenTo, TweenFrom, TweenFromTo, TweenTimeline } from 'turbo-tween/react';
import type { TweenTimelineHandle } from 'turbo-tween/react';
```

---

### `useTween()` hook

Creates a scoped `TweenEngine` that auto-cleans all tweens on unmount. The engine is lazily initialized via `useRef` and survives React strict mode's double-mount cycle.

**Return type:**

| Property       | Type                                                                                                                      | Description                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `to`           | `(target: AnimatableTarget, duration: number, options?: TweenOptions) => TweenInstance`                                   | Same as `Tween.to()`, scoped to this component. Stable reference (wrapped in `useCallback`).                         |
| `from`         | `(target: AnimatableTarget, duration: number, options?: TweenOptions) => TweenInstance`                                   | Same as `Tween.from()`, scoped.                                                                                      |
| `fromTo`       | `(target: AnimatableTarget, duration: number, fromVars: Record<string, unknown>, toVars?: TweenOptions) => TweenInstance` | Same as `Tween.fromTo()`, scoped.                                                                                    |
| `killAll`      | `() => void`                                                                                                              | Kill all tweens in this scope.                                                                                       |
| `killTweensOf` | `(target: AnimatableTarget) => void`                                                                                      | Kill tweens for a specific target.                                                                                   |
| `isAnimating`  | `boolean`                                                                                                                 | `true` when at least one tween in this scope is active. Triggers a re-render when it changes (backed by `useState`). |

**Strict mode safety:** The engine is stored in a `useRef` and lazily created. The cleanup effect (`useEffect` return) calls `killAll()` and nulls the ref. On strict mode re-mount, a fresh engine is created transparently.

**Example:**

```tsx
import { useRef, useEffect } from 'react';
import { useTween } from 'turbo-tween/react';
import { quadOut } from 'turbo-tween';

function AnimatedBox() {
  const ref = useRef<HTMLDivElement>(null);
  const { to, isAnimating } = useTween();

  useEffect(() => {
    if (ref.current) {
      to(ref.current, 1000, { x: 200, rotation: 90, ease: quadOut });
    }
  }, [to]);

  return (
    <>
      <div ref={ref} className="box" />
      {isAnimating && <p>Animating...</p>}
    </>
  );
}
```

---

### Declarative Components

React declarative components follow the same pattern as Vue: they wrap a single child element and apply animation to it. When nested inside `<TweenTimeline>`, they register via React Context instead of playing standalone.

---

#### `<TweenTo>`

**Props:**

| Prop       | Type                      | Default     | Required | Description                                 |
| ---------- | ------------------------- | ----------- | -------- | ------------------------------------------- |
| `duration` | `number`                  | `500`       | No       | Duration in milliseconds.                   |
| `to`       | `Record<string, unknown>` | --          | Yes      | Target property values.                     |
| `ease`     | `EasingFunction`          | `undefined` | No       | Easing function.                            |
| `delay`    | `number`                  | `0`         | No       | Delay before animation starts.              |
| `children` | `ReactNode`               | --          | Yes      | A single child element (must accept a ref). |

**Example:**

```tsx
<TweenTo duration={800} to={{ x: 200, opacity: 1 }} ease={quadOut}>
  <div className="card">Hello</div>
</TweenTo>
```

---

#### `<TweenFrom>`

**Props:**

| Prop       | Type                      | Default     | Required | Description                    |
| ---------- | ------------------------- | ----------- | -------- | ------------------------------ |
| `duration` | `number`                  | `500`       | No       | Duration in milliseconds.      |
| `from`     | `Record<string, unknown>` | --          | Yes      | Starting property values.      |
| `ease`     | `EasingFunction`          | `undefined` | No       | Easing function.               |
| `delay`    | `number`                  | `0`         | No       | Delay before animation starts. |
| `children` | `ReactNode`               | --          | Yes      | A single child element.        |

**Example:**

```tsx
<TweenFrom duration={600} from={{ opacity: 0, y: -30 }} ease={cubicOut}>
  <h1>Welcome</h1>
</TweenFrom>
```

---

#### `<TweenFromTo>`

**Props:**

| Prop       | Type                      | Default     | Required | Description                    |
| ---------- | ------------------------- | ----------- | -------- | ------------------------------ |
| `duration` | `number`                  | `500`       | No       | Duration in milliseconds.      |
| `from`     | `Record<string, unknown>` | --          | Yes      | Starting property values.      |
| `to`       | `Record<string, unknown>` | --          | Yes      | Ending property values.        |
| `ease`     | `EasingFunction`          | `undefined` | No       | Easing function.               |
| `delay`    | `number`                  | `0`         | No       | Delay before animation starts. |
| `children` | `ReactNode`               | --          | Yes      | A single child element.        |

**Example:**

```tsx
<TweenFromTo
  duration={1000}
  from={{ x: -100, opacity: 0 }}
  to={{ x: 0, opacity: 1 }}
  ease={backOut}
>
  <div className="panel">Content</div>
</TweenFromTo>
```

---

#### `<TweenTimeline>`

Orchestrates child `<TweenTo>`, `<TweenFrom>`, and `<TweenFromTo>` components into a sequenced timeline. Children register via React Context (`TimelineContext`). The component is built with `forwardRef` and exposes a `TweenTimelineHandle` via `useImperativeHandle`.

**Props:**

| Prop         | Type                                           | Default     | Description                                |
| ------------ | ---------------------------------------------- | ----------- | ------------------------------------------ |
| `autoPlay`   | `boolean`                                      | `true`      | Whether to start playback on mount.        |
| `defaults`   | `{ duration?: number; ease?: EasingFunction }` | `undefined` | Default duration and easing for children.  |
| `onComplete` | `() => void`                                   | `undefined` | Called when the timeline finishes playing. |
| `children`   | `ReactNode`                                    | --          | Child tween components.                    |

**`TweenTimelineHandle` (ref interface):**

```ts
interface TweenTimelineHandle {
  play: () => void;
  pause: () => void;
  resume: () => void;
  reverse: () => void;
  seek: (timeMs: number) => void;
  kill: () => void;
  getTimeline: () => Timeline | null;
}
```

**Example with sequenced children and ref control:**

```tsx
import { useRef } from 'react';
import { TweenTimeline, TweenFrom, TweenTo, type TweenTimelineHandle } from 'turbo-tween/react';
import { cubicOut, backOut } from 'turbo-tween';

function IntroAnimation() {
  const tlRef = useRef<TweenTimelineHandle>(null);

  function replay() {
    tlRef.current?.seek(0);
    tlRef.current?.play();
  }

  return (
    <>
      <TweenTimeline
        ref={tlRef}
        autoPlay
        defaults={{ ease: cubicOut }}
        onComplete={() => console.log('done')}
      >
        <TweenFrom duration={600} from={{ opacity: 0, y: -40 }}>
          <h1>Title</h1>
        </TweenFrom>

        <TweenFrom duration={500} from={{ opacity: 0, y: 20 }}>
          <p>Subtitle text</p>
        </TweenFrom>

        <TweenTo duration={400} to={{ scale: 1, opacity: 1 }} ease={backOut}>
          <button className="cta">Get Started</button>
        </TweenTo>
      </TweenTimeline>

      <button onClick={replay}>Replay</button>
    </>
  );
}
```

**How children register:** Each child tween component calls `useContext(TimelineContext)`. If the context is non-null (meaning a `<TweenTimeline>` parent exists), the child pushes its entry (mode, target getter, duration, options) into the timeline's entry list during its `useEffect`. The timeline's own `useEffect` then builds the `Timeline` instance from those entries. On unmount, the timeline is killed and the entry list is cleared.

---

## Transform Shorthands

Transform shorthands let you animate CSS transform properties with simple numeric values instead of building transform strings manually. Turbo-Tween maintains an internal `TransformState` per element (stored in a `WeakMap`) and composes the final `transform` string automatically.

### Full table

| Shorthand   | CSS Equivalent      | Unit | Default | Description                                                                     |
| ----------- | ------------------- | ---- | ------- | ------------------------------------------------------------------------------- |
| `x`         | `translateX`        | px   | `0`     | Horizontal translation.                                                         |
| `y`         | `translateY`        | px   | `0`     | Vertical translation.                                                           |
| `z`         | `translateZ`        | px   | `0`     | Depth translation. Triggers GPU layer (`translate3d`).                          |
| `scale`     | `scaleX` + `scaleY` | --   | `1`     | Uniform scale. Sets both `scaleX` and `scaleY`. When reading, returns `scaleX`. |
| `scaleX`    | `scaleX`            | --   | `1`     | Horizontal scale.                                                               |
| `scaleY`    | `scaleY`            | --   | `1`     | Vertical scale.                                                                 |
| `scaleZ`    | `scaleZ`            | --   | `1`     | Depth scale. Triggers `scale3d()`.                                              |
| `rotation`  | `rotate`            | deg  | `0`     | 2D rotation in degrees.                                                         |
| `rotationX` | `rotateX`           | deg  | `0`     | 3D rotation around the X axis.                                                  |
| `rotationY` | `rotateY`           | deg  | `0`     | 3D rotation around the Y axis.                                                  |
| `rotationZ` | `rotateZ`           | deg  | `0`     | 3D rotation around the Z axis.                                                  |
| `skewX`     | `skewX`             | deg  | `0`     | Horizontal skew in degrees.                                                     |
| `skewY`     | `skewY`             | deg  | `0`     | Vertical skew in degrees.                                                       |

### Composition order

Turbo-Tween composes the final CSS `transform` string in a fixed order:

```
translate -> rotate -> skew -> scale
```

This order is always the same regardless of the order you specify properties in the options object. The fixed order ensures predictable visual results.

### GPU acceleration with `z`

When the `z` value is non-zero, Turbo-Tween switches from `translate(x, y)` to `translate3d(x, y, z)`. This promotes the element to its own GPU compositing layer, which can improve performance for complex animations. Similarly, a non-unity `scaleZ` triggers `scale3d()`.

### How `scale` works

Setting `scale` writes to both `scaleX` and `scaleY` simultaneously. Reading `scale` returns the value of `scaleX` (assumes uniform scaling). If you need non-uniform scaling, use `scaleX` and `scaleY` independently.

```ts
// Uniform scale
Tween.to(el, 500, { scale: 1.5 });
// => scaleX: 1.5, scaleY: 1.5

// Non-uniform scale
Tween.to(el, 500, { scaleX: 2, scaleY: 0.5 });
```

---

## Overwrite Modes

When multiple tweens target the same element simultaneously, overwrite modes control how conflicts are resolved. Set the mode via the `overwrite` option.

### `'none'` (default)

No automatic conflict resolution. All tweens run independently, even if they animate the same properties. The last tween to write a value on each frame wins.

**When to use:** When you know tweens will not conflict, or when you want full manual control using `killTweensOf()`.

```ts
// Both tweens run. Whichever writes 'x' last on each frame determines the visual result.
Tween.to(el, 1000, { x: 100 });
Tween.to(el, 1000, { x: 200 });
```

### `'auto'`

Kills only existing tweens that animate **overlapping properties** on the same target. Tweens animating different properties on the same target are left alone.

**When to use:** Interactive scenarios where new animations should override the same property but you have independent property animations running in parallel (e.g., `x` driven by scroll and `opacity` driven by hover).

```ts
// The first tween is killed because the second also animates 'x'.
Tween.to(el, 1000, { x: 100, opacity: 1 });
Tween.to(el, 500, { x: 200, overwrite: 'auto' });
// The opacity animation from the first tween is also killed (entire tween is killed if any property overlaps).
```

### `'all'`

Kills **all** existing tweens on the same target, regardless of which properties they animate.

**When to use:** Hard resets. For example, when a user action should completely take over all animation on an element.

```ts
// Any active tween on `el` is killed, no matter what properties it animates.
Tween.to(el, 1000, { x: 100 });
Tween.to(el, 500, { scale: 2, overwrite: 'all' });
```

---

## SSR Safety

Turbo-Tween is SSR-safe out of the box. You do not need conditional imports, dynamic `import()`, or `typeof window` guards.

### How it works

When `isBrowser()` returns `false` (no `window` or `document`), the engine returns a **no-op tween** that:

- Has all the same methods (`pause`, `resume`, `reverse`, `seek`, `kill`) -- they do nothing.
- Has all the same properties (`progress: 0`, `isActive: false`, etc.).
- Implements `.then()` that resolves immediately, so `await Tween.to(...)` resolves without error.

DOM property parsing is skipped entirely on the server. No `getComputedStyle` calls, no DOM writes.

### Framework compatibility

- **Nuxt** -- works in `setup()`, `onMounted()`, plugins, and middleware. Animations simply do nothing during SSR and run normally after hydration.
- **Next.js** -- works in components, hooks, and effects. Server-rendered output is static; animations activate on the client.

```ts
// This code is safe in any environment. No guards needed.
import { Tween, quadOut } from 'turbo-tween';

const tween = Tween.to(el, 1000, { x: 100, ease: quadOut });
await tween; // resolves immediately on server, after animation on client
```

---

## Plain Object Animation

Turbo-Tween is not limited to DOM elements. Any JavaScript object with numeric properties can be animated. This is useful for cameras, particle systems, game state, data visualizations, or any value-driven rendering.

The key pattern: animate the object, then use `onUpdate` to render the current state.

### Full example: animating a camera

```ts
import { Tween, cubicInOut } from 'turbo-tween';

const camera = { x: 0, y: 0, zoom: 1 };

function renderScene(cam: typeof camera) {
  ctx.setTransform(cam.zoom, 0, 0, cam.zoom, -cam.x * cam.zoom, -cam.y * cam.zoom);
  drawWorld();
}

await Tween.to(camera, 2000, {
  x: 500,
  y: 300,
  zoom: 2,
  ease: cubicInOut,
  onUpdate: () => renderScene(camera),
});
```

### Example: particle system

```ts
const particle = { x: 0, y: 0, alpha: 1, size: 10 };

Tween.to(particle, 1500, {
  x: Math.random() * 400,
  y: -200,
  alpha: 0,
  size: 0,
  ease: quadOut,
  onUpdate: () => {
    ctx.globalAlpha = particle.alpha;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  },
  onComplete: () => {
    // Return particle to pool
  },
});
```

### Example: animating game state with a timeline

```ts
import { Timeline, sineInOut, cubicOut } from 'turbo-tween';

const state = { health: 100, shield: 50, score: 0 };

function updateUI() {
  healthBar.style.width = `${state.health}%`;
  shieldBar.style.width = `${state.shield}%`;
  scoreDisplay.textContent = Math.round(state.score).toString();
}

const tl = new Timeline();
tl.to(state, 800, { health: 60, onUpdate: updateUI, ease: sineInOut })
  .to(state, 400, { shield: 0, onUpdate: updateUI, ease: cubicOut })
  .to(state, 1200, { score: 9500, onUpdate: updateUI, ease: cubicOut });

tl.play();
```

For plain objects, Turbo-Tween reads and writes properties directly (no `getComputedStyle`, no DOM). Every key in the options object that is not a reserved key and has a numeric value is interpolated between its current value and the target value.
