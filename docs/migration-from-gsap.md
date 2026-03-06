# Migrating from GSAP to Turbo-Tween

A comprehensive guide for moving your animation code from GSAP to Turbo-Tween. Every section includes before/after diffs so you can see exactly what changes.

---

## Table of Contents

1. [Why Migrate](#1-why-migrate)
2. [Installation](#2-installation)
3. [Core API Mapping](#3-core-api-mapping)
4. [Easing Migration](#4-easing-migration)
5. [Duration: Seconds to Milliseconds](#5-duration-seconds-to-milliseconds)
6. [Playback Control](#6-playback-control)
7. [Timeline Migration](#7-timeline-migration)
8. [Stagger Migration](#8-stagger-migration)
9. [Awaiting Completion](#9-awaiting-completion)
10. [Kill / Cleanup](#10-kill--cleanup)
11. [Overwrite Modes](#11-overwrite-modes)
12. [Transform Shorthands](#12-transform-shorthands)
13. [Framework Adapters](#13-framework-adapters)
14. [What's Not Supported](#14-whats-not-supported)
15. [Migration Checklist](#15-migration-checklist)

---

## 1. Why Migrate

### Bundle Size

| Library              | Minified + gzipped |
| -------------------- | ------------------ |
| GSAP core            | ~25 KB             |
| GSAP + ScrollTrigger | ~38 KB             |
| **Turbo-Tween**      | **< 3 KB**         |

Turbo-Tween is roughly **8x smaller** than GSAP core. If your project only needs tween/timeline animation (no scroll-triggered, SVG morphing, or physics), you are shipping a lot of unused code with GSAP.

### License

GSAP uses a **custom "no-charge" license** that restricts use in certain commercial contexts and requires a paid "Business Green" license for SaaS products. Turbo-Tween is **MIT-licensed** -- free for any use, commercial or otherwise, with no strings attached.

### TypeScript-First

Turbo-Tween is written in TypeScript from the ground up. Every function signature, option key, and return type is fully typed. GSAP ships type declarations, but its core is plain JavaScript and many edge cases are typed as `any`.

### Framework Adapters Included

GSAP has no official Vue or React integration. You wire up lifecycle cleanup yourself. Turbo-Tween ships first-party composables (`useTween` for Vue), hooks (`useTween` for React), and declarative components (`TweenTo`, `TweenFrom`, `TweenFromTo`, `TweenTimeline`) for both frameworks -- with automatic cleanup on unmount.

---

## 2. Installation

```diff
- npm install gsap
+ npm install @timbenniks/turbo-tween
```

Imports change accordingly:

```diff
- import gsap from 'gsap';
+ import { Tween, quadOut } from '@timbenniks/turbo-tween';
```

For framework adapters:

```diff
- import gsap from 'gsap';
+ import { useTween } from '@timbenniks/turbo-tween/vue';   // Vue
+ import { useTween } from '@timbenniks/turbo-tween/react'; // React
```

---

## 3. Core API Mapping

### gsap.to() -> Tween.to()

**Simple example:**

```diff
- import gsap from 'gsap';
- gsap.to('.box', { x: 100, duration: 1, ease: 'power2.out' });

+ import { Tween, cubicOut } from '@timbenniks/turbo-tween';
+ Tween.to(element, 1000, { x: 100, ease: cubicOut });
```

**Complex example with callbacks:**

```diff
- gsap.to('.box', {
-   x: 200,
-   opacity: 0.5,
-   duration: 1.5,
-   delay: 0.3,
-   ease: 'back.out',
-   onStart: () => console.log('started'),
-   onUpdate: (self) => console.log(self.progress()),
-   onComplete: () => console.log('done'),
- });

+ import { Tween, backOut } from '@timbenniks/turbo-tween';
+ Tween.to(element, 1500, {
+   x: 200,
+   opacity: 0.5,
+   delay: 300,
+   ease: backOut,
+   onStart: () => console.log('started'),
+   onUpdate: (progress) => console.log(progress),
+   onComplete: () => console.log('done'),
+ });
```

**Key differences:**

| Aspect       | GSAP                                  | Turbo-Tween                           |
| ------------ | ------------------------------------- | ------------------------------------- |
| Duration     | Inside options object, in **seconds** | **2nd argument**, in **milliseconds** |
| Delay        | In seconds (`delay: 0.3`)             | In milliseconds (`delay: 300`)        |
| Easing       | String (`'power2.out'`)               | Imported function (`cubicOut`)        |
| Target       | CSS selector string or element        | Element reference only                |
| onUpdate arg | Tween instance                        | Progress number (0..1)                |

### gsap.from() -> Tween.from()

```diff
- gsap.from('.box', {
-   opacity: 0,
-   y: -50,
-   duration: 0.5,
-   ease: 'power1.out',
- });

+ import { Tween, quadOut } from '@timbenniks/turbo-tween';
+ Tween.from(element, 500, {
+   opacity: 0,
+   y: -50,
+   ease: quadOut,
+ });
```

**Behavior difference:** Both GSAP and Turbo-Tween immediately apply the `from` values on the first frame before animating back to the element's current state. The values you pass are where the animation **starts**, and the element's current computed values are where it **ends**.

### gsap.fromTo() -> Tween.fromTo()

```diff
- gsap.fromTo('.box',
-   { x: -100, opacity: 0 },
-   { x: 100, opacity: 1, duration: 0.8, ease: 'expo.out' }
- );

+ import { Tween, expoOut } from '@timbenniks/turbo-tween';
+ Tween.fromTo(element, 800,
+   { x: -100, opacity: 0 },
+   { x: 100, opacity: 1, ease: expoOut }
+ );
```

**Signature comparison:**

```
GSAP:         gsap.fromTo(target, fromVars, toVars)
                                            ^ duration lives inside toVars

Turbo-Tween:  Tween.fromTo(target, duration, fromVars, toVars)
                            ^ 4 args, duration is explicit
```

The `fromVars` object contains only property values. The `toVars` object contains property values plus configuration (`ease`, `delay`, `onComplete`, etc.).

---

## 4. Easing Migration

GSAP uses **string identifiers** for easings. Turbo-Tween uses **imported functions** that are fully tree-shakeable -- if you only use `quadOut` and `backOut`, no other easing code ships in your bundle.

### Complete Mapping Table

| GSAP String       | Turbo-Tween Import | Notes                    |
| ----------------- | ------------------ | ------------------------ |
| `'none'`          | `linear`           |                          |
| `'linear'`        | `linear`           |                          |
| `'power1.in'`     | `quadIn`           | power1 = quadratic (t^2) |
| `'power1.out'`    | `quadOut`          |                          |
| `'power1.inOut'`  | `quadInOut`        |                          |
| `'power2.in'`     | `cubicIn`          | power2 = cubic (t^3)     |
| `'power2.out'`    | `cubicOut`         |                          |
| `'power2.inOut'`  | `cubicInOut`       |                          |
| `'power3.in'`     | `quartIn`          | power3 = quartic (t^4)   |
| `'power3.out'`    | `quartOut`         |                          |
| `'power3.inOut'`  | `quartInOut`       |                          |
| `'power4.in'`     | `quintIn`          | power4 = quintic (t^5)   |
| `'power4.out'`    | `quintOut`         |                          |
| `'power4.inOut'`  | `quintInOut`       |                          |
| `'sine.in'`       | `sineIn`           |                          |
| `'sine.out'`      | `sineOut`          |                          |
| `'sine.inOut'`    | `sineInOut`        |                          |
| `'expo.in'`       | `expoIn`           |                          |
| `'expo.out'`      | `expoOut`          |                          |
| `'expo.inOut'`    | `expoInOut`        |                          |
| `'circ.in'`       | `circIn`           |                          |
| `'circ.out'`      | `circOut`          |                          |
| `'circ.inOut'`    | `circInOut`        |                          |
| `'back.in'`       | `backIn`           |                          |
| `'back.out'`      | `backOut`          |                          |
| `'back.inOut'`    | `backInOut`        |                          |
| `'elastic.in'`    | `elasticIn`        |                          |
| `'elastic.out'`   | `elasticOut`       |                          |
| `'elastic.inOut'` | `elasticInOut`     |                          |
| `'bounce.in'`     | `bounceIn`         |                          |
| `'bounce.out'`    | `bounceOut`        |                          |
| `'bounce.inOut'`  | `bounceInOut`      |                          |

**GSAP alias note:** GSAP also accepts `'quad.out'`, `'cubic.out'`, etc. Map those to the same Turbo-Tween imports as the `power` equivalents above.

### Custom Easings

GSAP requires the paid `CustomEase` plugin to create custom curves. In Turbo-Tween, any function `(t: number) => number` works:

```diff
- import { CustomEase } from 'gsap/CustomEase';
- gsap.registerPlugin(CustomEase);
- CustomEase.create('myEase', 'M0,0 C0.25,0.1 0.25,1 1,1');
- gsap.to(el, { x: 100, ease: 'myEase' });

+ import { Tween } from '@timbenniks/turbo-tween';
+ const myEase = (t: number) => t * t * (3 - 2 * t); // smoothstep
+ Tween.to(el, 1000, { x: 100, ease: myEase });
```

You can also compose easings:

```ts
import { Tween, cubicOut } from '@timbenniks/turbo-tween';

// Overshoot easing: cubic out + 10% overshoot
const overshoot = (t: number) => cubicOut(t) * 1.1 - 0.1 * cubicOut(t) * cubicOut(t);
Tween.to(el, 1000, { x: 100, ease: overshoot });
```

---

## 5. Duration: Seconds to Milliseconds

GSAP uses seconds. Turbo-Tween uses milliseconds. This is the most common change you will make during migration.

### Common Conversions

| GSAP (seconds) | Turbo-Tween (ms) |
| -------------- | ---------------- |
| `0.2`          | `200`            |
| `0.3`          | `300`            |
| `0.5`          | `500`            |
| `0.8`          | `800`            |
| `1`            | `1000`           |
| `1.5`          | `1500`           |
| `2`            | `2000`           |
| `3`            | `3000`           |

### Tips for Bulk Migration

**Find-and-replace pattern:** Search your codebase for `duration:` inside GSAP calls. Replace the value with `value * 1000`.

If you have many GSAP calls, a mechanical approach:

1. Search for `duration: (\d+\.?\d*)` with regex
2. Multiply the captured number by 1000
3. Move the duration from the options object to the 2nd argument position

Remember that `delay` also changes from seconds to milliseconds:

```diff
- gsap.to(el, { x: 100, duration: 0.5, delay: 0.2 });
+ Tween.to(el, 500, { x: 100, delay: 200 });
```

---

## 6. Playback Control

### Full Side-by-Side

```diff
  // Create a tween
- const tween = gsap.to(el, { x: 100, duration: 1 });
+ const tween = Tween.to(el, 1000, { x: 100 });

  // Pause
- tween.pause();
+ tween.pause();          // same

  // Resume (different method name!)
- tween.play();
+ tween.resume();         // Turbo-Tween uses 'resume', not 'play'

  // Reverse
- tween.reverse();
+ tween.reverse();        // same -- toggles direction

  // Seek to a point in time
- tween.seek(0.5);        // 0.5 seconds
+ tween.seek(500);        // 500 milliseconds

  // Read progress
- const p = tween.progress();  // method call, returns 0..1
+ const p = tween.progress;    // readonly getter, returns 0..1

  // Kill
- tween.kill();
+ tween.kill();           // same
```

**Key differences:**

| Action                | GSAP                        | Turbo-Tween               |
| --------------------- | --------------------------- | ------------------------- |
| Resume a paused tween | `tween.play()`              | `tween.resume()`          |
| Read progress         | `tween.progress()` (method) | `tween.progress` (getter) |
| Seek time unit        | seconds                     | milliseconds              |

### Additional Readonly State

Turbo-Tween exposes these readonly getters on tween instances:

```ts
tween.progress; // number (0..1)
tween.isActive; // boolean
tween.isPaused; // boolean
tween.isReversed; // boolean
tween.duration; // number (ms)
tween.currentTime; // number (ms elapsed)
```

---

## 7. Timeline Migration

### Basic Timeline

```diff
- import gsap from 'gsap';
-
- const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
- tl.to('.box', { x: 100, duration: 0.5 })
-   .to('.box', { y: 200, duration: 0.5 })
-   .from('.other', { opacity: 0, duration: 0.3 });

+ import { Timeline, cubicOut } from '@timbenniks/turbo-tween';
+
+ const tl = new Timeline({ defaults: { ease: cubicOut } });
+ tl.to(box, 500, { x: 100 })
+   .to(box, 500, { y: 200 })
+   .from(other, 300, { opacity: 0 });
+ tl.play(); // Turbo-Tween requires explicit .play()
```

### Key Differences

| Aspect            | GSAP                                              | Turbo-Tween                                   |
| ----------------- | ------------------------------------------------- | --------------------------------------------- |
| Create            | `gsap.timeline()`                                 | `new Timeline()`                              |
| Auto-plays        | Yes (by default)                                  | **No** -- call `.play()` explicitly           |
| Defaults          | `defaults: { ease: 'power2.out', duration: 0.5 }` | `defaults: { ease: cubicOut, duration: 500 }` |
| Chaining          | `.to()`, `.from()`, `.fromTo()`                   | Same -- `.to()`, `.from()`, `.fromTo()`       |
| Duration argument | Inside options                                    | 2nd argument (same as Tween API)              |
| Target            | CSS selector or element                           | Element reference only                        |

### autoPlay Option

If you want the GSAP-like behavior of auto-playing, pass `autoPlay: true`:

```ts
const tl = new Timeline({ autoPlay: true });
tl.to(box, 500, { x: 100 }).to(box, 500, { y: 200 });
// Plays automatically -- no .play() needed
```

### Cursor-Based Sequencing (No Position Labels)

GSAP supports **position labels** and **relative offsets** to place tweens at arbitrary points in a timeline:

```js
// GSAP
tl.to(el, { x: 100, duration: 0.5 }, 'start')
  .to(el, { y: 200, duration: 0.5 }, 'start+=0.2')
  .to(el, { scale: 2, duration: 0.3 }, '<');
```

Turbo-Tween uses a **sequential cursor** model. Each `.to()` / `.from()` / `.fromTo()` appends at the current cursor and advances it by the tween's duration. There are no labels, no `<` or `>` shortcuts, and no overlap syntax.

To create overlapping animations, use separate timelines or use the `delay` option within individual tweens:

```ts
const tl = new Timeline();
tl.to(el, 500, { x: 100 }).to(el, 500, { y: 200 }); // starts after x finishes (sequential)

// For overlap, manage via delay or multiple timelines
```

### Timeline Playback Control

```diff
- tl.pause();
- tl.play();
- tl.reverse();
- tl.seek(1.5);       // seconds
- tl.progress(0.5);   // set progress
- tl.kill();

+ tl.pause();
+ tl.resume();         // or tl.play() to start from scratch
+ tl.reverse();
+ tl.seek(1500);       // milliseconds
+ // tl.progress is readonly (use seek instead)
+ tl.kill();
```

---

## 8. Stagger Migration

GSAP handles stagger inline inside `.to()` options. Turbo-Tween uses a separate `stagger()` utility function combined with `Timeline.staggerTo()`.

### Basic Stagger

```diff
- gsap.to('.items', {
-   x: 100,
-   duration: 0.5,
-   stagger: 0.1,
- });

+ import { Timeline, stagger } from '@timbenniks/turbo-tween';
+ const tl = new Timeline();
+ tl.staggerTo(elements, 500, { x: 100 }, stagger(100));
+ tl.play();
```

**Note:** `elements` must be an array of element references (e.g., from `document.querySelectorAll()` spread into an array, or a Vue/React refs array).

### Stagger from Center

```diff
- gsap.to('.items', {
-   x: 100,
-   stagger: { amount: 0.5, from: 'center' },
- });

+ const tl = new Timeline();
+ tl.staggerTo(elements, 500, { x: 100 }, stagger(100, { from: 'center' }));
+ tl.play();
```

### Stagger from End

```diff
- gsap.to('.items', { x: 100, stagger: { each: 0.1, from: 'end' } });

+ const tl = new Timeline();
+ tl.staggerTo(elements, 500, { x: 100 }, stagger(100, { from: 'end' }));
+ tl.play();
```

### Stagger from a Specific Index

```diff
- gsap.to('.items', { x: 100, stagger: { each: 0.1, from: 3 } });

+ const tl = new Timeline();
+ tl.staggerTo(elements, 500, { x: 100 }, stagger(100, { from: 3 }));
+ tl.play();
```

### Stagger with Eased Distribution

```diff
- gsap.to('.items', {
-   x: 100,
-   stagger: { each: 0.1, from: 'center', ease: 'power2.out' },
- });

+ import { Timeline, stagger, cubicOut } from '@timbenniks/turbo-tween';
+ const tl = new Timeline();
+ tl.staggerTo(elements, 500, { x: 100 }, stagger(100, {
+   from: 'center',
+   ease: cubicOut,
+ }));
+ tl.play();
```

### Summary of stagger() Options

| GSAP                              | Turbo-Tween                           |
| --------------------------------- | ------------------------------------- |
| `stagger: 0.1`                    | `stagger(100)`                        |
| `stagger: { from: 'center' }`     | `stagger(amount, { from: 'center' })` |
| `stagger: { from: 'end' }`        | `stagger(amount, { from: 'end' })`    |
| `stagger: { from: 3 }`            | `stagger(amount, { from: 3 })`        |
| `stagger: { ease: 'power2.out' }` | `stagger(amount, { ease: cubicOut })` |

---

## 9. Awaiting Completion

Both GSAP and Turbo-Tween tweens are thenable. You can `await` them directly.

### Single Tween

```diff
- await gsap.to(el, { x: 100, duration: 1 });
- console.log('done');

+ await Tween.to(el, 1000, { x: 100 });
+ console.log('done');
```

### Timeline

```diff
- const tl = gsap.timeline();
- tl.to(el, { x: 100, duration: 0.5 })
-   .to(el, { y: 200, duration: 0.5 });
- await tl;

+ const tl = new Timeline();
+ tl.to(el, 500, { x: 100 })
+   .to(el, 500, { y: 200 });
+ tl.play();
+ await tl;
```

### Chaining with .then()

```diff
- gsap.to(el, { x: 100, duration: 1 }).then(() => {
-   gsap.to(el, { y: 200, duration: 1 });
- });

+ Tween.to(el, 1000, { x: 100 }).then(() => {
+   Tween.to(el, 1000, { y: 200 });
+ });
```

---

## 10. Kill / Cleanup

### Kill Tweens on a Specific Target

```diff
- gsap.killTweensOf(element);
+ Tween.killTweensOf(element);
```

### Kill All Tweens

```diff
- gsap.globalTimeline.clear();
+ Tween.killAll();
```

### Component Cleanup: Vue

```diff
- // GSAP -- manual cleanup required
- import { onMounted, onUnmounted, ref } from 'vue';
- import gsap from 'gsap';
-
- const box = ref<HTMLElement>();
- let tween: gsap.core.Tween;
-
- onMounted(() => {
-   tween = gsap.to(box.value, { x: 100, duration: 1 });
- });
-
- onUnmounted(() => {
-   tween?.kill();
- });

+ // Turbo-Tween -- auto-cleanup via composable
+ import { ref, onMounted } from 'vue';
+ import { useTween } from '@timbenniks/turbo-tween/vue';
+ import { quadOut } from '@timbenniks/turbo-tween';
+
+ const box = ref<HTMLElement>();
+ const { to } = useTween(); // auto-kills all tweens on unmount
+
+ onMounted(() => {
+   to(box.value!, 1000, { x: 100, ease: quadOut });
+ });
```

### Component Cleanup: React

```diff
- // GSAP -- manual cleanup required
- import { useRef, useEffect } from 'react';
- import gsap from 'gsap';
-
- function Component() {
-   const box = useRef<HTMLDivElement>(null);
-
-   useEffect(() => {
-     const tween = gsap.to(box.current, { x: 100, duration: 1 });
-     return () => tween.kill();
-   }, []);
-
-   return <div ref={box}>Box</div>;
- }

+ // Turbo-Tween -- auto-cleanup via hook
+ import { useRef, useEffect } from 'react';
+ import { useTween } from '@timbenniks/turbo-tween/react';
+ import { quadOut } from '@timbenniks/turbo-tween';
+
+ function Component() {
+   const box = useRef<HTMLDivElement>(null);
+   const { to } = useTween(); // auto-kills all tweens on unmount
+
+   useEffect(() => {
+     if (box.current) {
+       to(box.current, 1000, { x: 100, ease: quadOut });
+     }
+   }, []);
+
+   return <div ref={box}>Box</div>;
+ }
```

---

## 11. Overwrite Modes

Turbo-Tween supports the same overwrite concept as GSAP with the same option names.

```diff
- gsap.to(el, { x: 100, overwrite: 'auto' });
+ Tween.to(el, 1000, { x: 100, overwrite: 'auto' });
```

| Mode     | Behavior                                                                      |
| -------- | ----------------------------------------------------------------------------- |
| `'none'` | Default. No tweens are killed.                                                |
| `'auto'` | Kills only tweens on the same target that animate **overlapping properties**. |
| `'all'`  | Kills **all** active tweens on the same target, regardless of properties.     |

**Example -- preventing conflicting x animations:**

```diff
- // GSAP
- gsap.to(el, { x: 100, duration: 1 });
- // Later, interrupt with a new x tween:
- gsap.to(el, { x: 200, duration: 0.5, overwrite: 'auto' });

+ // Turbo-Tween
+ Tween.to(el, 1000, { x: 100 });
+ // Later, interrupt with a new x tween:
+ Tween.to(el, 500, { x: 200, overwrite: 'auto' });
```

---

## 12. Transform Shorthands

Turbo-Tween supports the same transform shorthand names as GSAP:

| Shorthand   | CSS Equivalent                       |
| ----------- | ------------------------------------ |
| `x`         | `translateX()`                       |
| `y`         | `translateY()`                       |
| `z`         | `translateZ()` -- triggers GPU layer |
| `scale`     | `scale()`                            |
| `scaleX`    | `scaleX()`                           |
| `scaleY`    | `scaleY()`                           |
| `scaleZ`    | `scaleZ()`                           |
| `rotation`  | `rotate()`                           |
| `rotationX` | `rotateX()`                          |
| `rotationY` | `rotateY()`                          |
| `rotationZ` | `rotateZ()`                          |
| `skewX`     | `skewX()`                            |
| `skewY`     | `skewY()`                            |

### Composition Order

Both libraries use the same transform composition order:

**translate -> rotate -> skew -> scale**

This means `{ x: 100, rotation: 45, scale: 1.5 }` will always apply translation first, then rotation, then scale.

### GPU Acceleration with z

Adding `z: 0` to your tween promotes the element to its own compositor layer (via `translate3d`), which can improve performance:

```ts
Tween.to(el, 1000, { x: 100, y: 50, z: 0 }); // triggers translate3d(100px, 50px, 0px)
```

This is the same trick used in GSAP with `force3D: true`, except Turbo-Tween does it explicitly through the `z` property.

---

## 13. Framework Adapters

Turbo-Tween ships first-party Vue and React integrations. GSAP has no official equivalent.

### Vue: Imperative (Composable)

**Before (GSAP):**

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import gsap from 'gsap';

const box = ref<HTMLElement>();
let tween: gsap.core.Tween;

onMounted(() => {
  tween = gsap.to(box.value, {
    x: 200,
    rotation: 360,
    duration: 1,
    ease: 'power2.out',
  });
});

onUnmounted(() => {
  tween?.kill();
});
</script>

<template>
  <div ref="box">Animated</div>
</template>
```

**After (Turbo-Tween):**

```vue
<script setup>
import { ref, onMounted } from 'vue';
import { useTween } from '@timbenniks/turbo-tween/vue';
import { cubicOut } from '@timbenniks/turbo-tween';

const box = ref<HTMLElement>();
const { to, isAnimating } = useTween(); // auto-cleanup on unmount

onMounted(() => {
  to(box.value!, 1000, { x: 200, rotation: 360, ease: cubicOut });
});
</script>

<template>
  <div ref="box">Animated</div>
  <p v-if="isAnimating">Animating...</p>
</template>
```

The `useTween()` composable returns `to`, `from`, `fromTo`, `killAll`, `killTweensOf`, and a reactive `isAnimating` ref. All tweens created through it are automatically killed when the component unmounts.

### Vue: Declarative (Components)

**Before (GSAP):** No declarative option exists. You must use imperative code in `onMounted`.

**After (Turbo-Tween):**

```vue
<script setup>
import { TweenTo, TweenFrom, TweenTimeline } from '@timbenniks/turbo-tween/vue';
import { cubicOut } from '@timbenniks/turbo-tween';
</script>

<template>
  <!-- Standalone tween -->
  <TweenTo :duration="1000" :to="{ x: 200, rotation: 360 }" :ease="cubicOut">
    <div>I animate on mount</div>
  </TweenTo>

  <!-- Timeline: children execute sequentially -->
  <TweenTimeline :defaults="{ ease: cubicOut }">
    <TweenTo :duration="500" :to="{ x: 100 }">
      <div>Step 1</div>
    </TweenTo>
    <TweenFrom :duration="500" :to="{ opacity: 0 }">
      <div>Step 2</div>
    </TweenFrom>
  </TweenTimeline>
</template>
```

Timeline components expose playback control via `ref`:

```vue
<script setup>
import { ref } from 'vue';
import { TweenTimeline, TweenTo } from '@timbenniks/turbo-tween/vue';

const timeline = ref();

function replay() {
  timeline.value.seek(0);
  timeline.value.play();
}
</script>

<template>
  <TweenTimeline ref="timeline" :auto-play="false">
    <TweenTo :duration="500" :to="{ x: 100 }">
      <div>Animated</div>
    </TweenTo>
  </TweenTimeline>
  <button @click="replay">Replay</button>
</template>
```

### React: Imperative (Hook)

**Before (GSAP):**

```tsx
import { useRef, useEffect } from 'react';
import gsap from 'gsap';

function Component() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tween = gsap.to(box.current, {
      x: 200,
      rotation: 360,
      duration: 1,
      ease: 'power2.out',
    });
    return () => tween.kill();
  }, []);

  return <div ref={box}>Animated</div>;
}
```

**After (Turbo-Tween):**

```tsx
import { useRef, useEffect } from 'react';
import { useTween } from '@timbenniks/turbo-tween/react';
import { cubicOut } from '@timbenniks/turbo-tween';

function Component() {
  const box = useRef<HTMLDivElement>(null);
  const { to, isAnimating } = useTween(); // auto-cleanup, strict mode safe

  useEffect(() => {
    if (box.current) {
      to(box.current, 1000, { x: 200, rotation: 360, ease: cubicOut });
    }
  }, []);

  return (
    <>
      <div ref={box}>Animated</div>
      {isAnimating && <p>Animating...</p>}
    </>
  );
}
```

The `useTween()` hook returns `to`, `from`, `fromTo`, `killAll`, `killTweensOf`, and an `isAnimating` state boolean. It handles React strict mode double-mounting gracefully, using a lazy-initialized engine that persists across remounts.

### React: Declarative (Components)

**Before (GSAP):** No declarative option exists.

**After (Turbo-Tween):**

```tsx
import { useRef } from 'react';
import { TweenTo, TweenTimeline } from '@timbenniks/turbo-tween/react';
import type { TweenTimelineHandle } from '@timbenniks/turbo-tween/react';
import { cubicOut } from '@timbenniks/turbo-tween';

function Component() {
  const tlRef = useRef<TweenTimelineHandle>(null);

  return (
    <>
      {/* Standalone tween */}
      <TweenTo duration={1000} to={{ x: 200 }} ease={cubicOut}>
        <div>I animate on mount</div>
      </TweenTo>

      {/* Timeline with ref handle for playback control */}
      <TweenTimeline ref={tlRef} defaults={{ ease: cubicOut }}>
        <TweenTo duration={500} to={{ x: 100 }}>
          <div>Step 1</div>
        </TweenTo>
        <TweenTo duration={500} to={{ y: 200 }}>
          <div>Step 2</div>
        </TweenTo>
      </TweenTimeline>

      <button onClick={() => tlRef.current?.reverse()}>Reverse</button>
    </>
  );
}
```

The `TweenTimelineHandle` ref exposes: `play()`, `pause()`, `resume()`, `reverse()`, `seek(timeMs)`, `kill()`, and `getTimeline()`.

---

## 14. What's Not Supported

Turbo-Tween is intentionally smaller than GSAP. The following GSAP features have no equivalent in Turbo-Tween:

| GSAP Feature                         | Status in Turbo-Tween                                                               |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| **ScrollTrigger**                    | Not available. Use Intersection Observer or a dedicated scroll library.             |
| **MorphSVG**                         | Not available.                                                                      |
| **MotionPath**                       | Not available.                                                                      |
| **DrawSVG**                          | Not available.                                                                      |
| **SplitText**                        | Not available. Use a dedicated text splitting library.                              |
| **Flip**                             | Not available.                                                                      |
| **CSS selector targets**             | Not supported. Pass element references, not strings like `'.box'`.                  |
| **Repeat / yoyo**                    | Not available. Implement with `onComplete` + re-trigger, or `reverse()`.            |
| **Relative values** (`+=`, `-=`)     | Not supported. Compute absolute values before passing them.                         |
| **Label-based timeline positioning** | Not available. Timeline uses sequential cursor only.                                |
| **Nested timelines**                 | Not available. Timelines are flat.                                                  |
| **Physics / spring**                 | Not available. Use a dedicated spring library (e.g., `popmotion`, `framer-motion`). |
| **SVG-specific animations**          | No special SVG handling. Standard CSS properties still work on SVG elements.        |
| **Text animation**                   | No built-in text splitting or per-character animation.                              |
| **MatchMedia / responsive**          | Not available. Use CSS media queries or `matchMedia` API directly.                  |
| **GSDevTools**                       | Not available.                                                                      |
| **Observer plugin**                  | Not available.                                                                      |

If your project relies heavily on any of these features, Turbo-Tween may not be a full replacement. Consider whether those features can be replaced with platform APIs or smaller dedicated libraries.

---

## 15. Migration Checklist

Use this checklist when migrating a project from GSAP to Turbo-Tween:

- [ ] **Replace imports** -- Change `import gsap from 'gsap'` to `import { Tween } from '@timbenniks/turbo-tween'` and import specific easings
- [ ] **Convert durations** -- Multiply all duration values by 1000 (seconds to milliseconds) and move from the options object to the 2nd argument
- [ ] **Convert delays** -- Multiply all delay values by 1000 (seconds to milliseconds)
- [ ] **Replace easing strings** -- Change string easings like `'power2.out'` to imported functions like `cubicOut`
- [ ] **Replace CSS selectors with element refs** -- Change `'.box'` to actual element references from `ref`, `useRef`, or `querySelector`
- [ ] **Add `.play()` to timelines** -- GSAP timelines auto-play; Turbo-Tween timelines require explicit `.play()` (or `autoPlay: true`)
- [ ] **Rename `.play()` to `.resume()`** -- On tween instances, use `resume()` instead of `play()` to unpause
- [ ] **Switch `progress()` to `progress`** -- Change method calls to property access (readonly getter)
- [ ] **Convert seek values** -- Change `seek()` arguments from seconds to milliseconds
- [ ] **Extract stagger to utility** -- Replace inline `stagger` option with `stagger()` function + `Timeline.staggerTo()`
- [ ] **Switch to composable/hook** -- Replace manual `onUnmounted`/`useEffect` cleanup with `useTween()` for auto-cleanup
- [ ] **Consider declarative components** -- Replace imperative `onMounted`/`useEffect` animation setup with `TweenTo`/`TweenFrom`/`TweenTimeline` components where appropriate
- [ ] **Test playback control** -- Verify pause, resume, reverse, and seek work correctly with the new API
- [ ] **Verify transforms** -- Ensure `x`, `y`, `rotation`, `scale`, etc. render identically
- [ ] **Remove GSAP** -- Once everything works, `npm uninstall gsap`
