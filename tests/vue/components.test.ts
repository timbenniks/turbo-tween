import { describe, it, expect } from 'vite-plus/test';
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref, nextTick } from 'vue';
import { TweenTo } from '../../src/vue/TweenTo';
import { TweenFrom } from '../../src/vue/TweenFrom';
import { TweenFromTo } from '../../src/vue/TweenFromTo';
import { TweenTimeline } from '../../src/vue/TweenTimeline';
import { linear } from '../../src/easings';

describe('Vue TweenTo component', () => {
  it('should render the slot content', () => {
    const wrapper = mount(TweenTo, {
      props: { to: { opacity: 1 }, ease: linear },
      slots: {
        default: () => h('div', { class: 'box' }, 'Hello'),
      },
    });

    expect(wrapper.find('.box').exists()).toBe(true);
    expect(wrapper.text()).toBe('Hello');
  });

  it('should render nothing without slot content', () => {
    const wrapper = mount(TweenTo, {
      props: { to: { opacity: 1 } },
    });

    expect(wrapper.html()).toBe('');
  });
});

describe('Vue TweenFrom component', () => {
  it('should render the slot content', () => {
    const wrapper = mount(TweenFrom, {
      props: { from: { opacity: 0 }, ease: linear },
      slots: {
        default: () => h('div', { class: 'box' }, 'Hello'),
      },
    });

    expect(wrapper.find('.box').exists()).toBe(true);
  });

  it('should render nothing without slot content', () => {
    const wrapper = mount(TweenFrom, {
      props: { from: { opacity: 0 } },
    });

    expect(wrapper.html()).toBe('');
  });
});

describe('Vue TweenFromTo component', () => {
  it('should render the slot content', () => {
    const wrapper = mount(TweenFromTo, {
      props: { from: { opacity: 0 }, to: { opacity: 1 }, ease: linear },
      slots: {
        default: () => h('div', { class: 'box' }, 'Hello'),
      },
    });

    expect(wrapper.find('.box').exists()).toBe(true);
  });

  it('should render nothing without slot content', () => {
    const wrapper = mount(TweenFromTo, {
      props: { from: { opacity: 0 }, to: { opacity: 1 } },
    });

    expect(wrapper.html()).toBe('');
  });
});

describe('Vue TweenTimeline component', () => {
  it('should render children', () => {
    const App = defineComponent({
      setup() {
        return () =>
          h(TweenTimeline, { autoPlay: false }, () => [
            h(TweenTo, { to: { opacity: 1 }, duration: 500, ease: linear }, () =>
              h('div', { class: 'item1' }, 'Item 1'),
            ),
            h(TweenTo, { to: { opacity: 1 }, duration: 500, ease: linear }, () =>
              h('div', { class: 'item2' }, 'Item 2'),
            ),
          ]);
      },
    });

    const wrapper = mount(App);
    expect(wrapper.find('.item1').exists()).toBe(true);
    expect(wrapper.find('.item2').exists()).toBe(true);
  });

  it('should expose timeline controls via ref', async () => {
    const timelineRef = ref<InstanceType<typeof TweenTimeline> | null>(null);

    const App = defineComponent({
      setup() {
        return () =>
          h(TweenTimeline, { ref: timelineRef, autoPlay: false, defaults: { ease: linear } }, () =>
            h(TweenTo, { to: { opacity: 1 }, duration: 500 }, () => h('div', { class: 'box' })),
          );
      },
    });

    mount(App);
    await nextTick();

    const tl = timelineRef.value as Record<string, unknown> | null;
    expect(tl).toBeTruthy();
    expect(typeof tl?.play).toBe('function');
    expect(typeof tl?.pause).toBe('function');
    expect(typeof tl?.seek).toBe('function');
    expect(typeof tl?.kill).toBe('function');
    expect(typeof tl?.resume).toBe('function');
    expect(typeof tl?.reverse).toBe('function');
    expect(typeof tl?.getTimeline).toBe('function');
  });

  it('should invoke exposed play/pause/seek/kill methods without error', async () => {
    const timelineRef = ref<Record<string, (...args: unknown[]) => unknown> | null>(null);

    const App = defineComponent({
      setup() {
        return () =>
          h(TweenTimeline, { ref: timelineRef, autoPlay: false, defaults: { ease: linear } }, () =>
            h(TweenTo, { to: { opacity: 1 }, duration: 500 }, () => h('div', { class: 'box' })),
          );
      },
    });

    mount(App);
    await nextTick();

    expect(timelineRef.value).toBeTruthy();
    const tl = timelineRef.value as {
      play: () => void;
      pause: () => void;
      resume: () => void;
      reverse: () => void;
      seek: (timeMs: number) => void;
      kill: () => void;
      getTimeline: () => unknown;
    };
    expect(() => tl.play()).not.toThrow();
    expect(() => tl.pause()).not.toThrow();
    expect(() => tl.resume()).not.toThrow();
    expect(() => tl.reverse()).not.toThrow();
    expect(() => tl.seek(100)).not.toThrow();
    expect(tl.getTimeline()).toBeTruthy();
    expect(() => tl.kill()).not.toThrow();
  });

  it('should register from() entries inside timeline', async () => {
    const App = defineComponent({
      setup() {
        return () =>
          h(TweenTimeline, { autoPlay: false, defaults: { ease: linear } }, () => [
            h(TweenFrom, { from: { opacity: 0 }, duration: 300 }, () =>
              h('div', { class: 'from-item' }),
            ),
          ]);
      },
    });

    const wrapper = mount(App);
    await nextTick();
    expect(wrapper.find('.from-item').exists()).toBe(true);
  });

  it('should register fromTo() entries inside timeline', async () => {
    const App = defineComponent({
      setup() {
        return () =>
          h(TweenTimeline, { autoPlay: false, defaults: { ease: linear } }, () => [
            h(TweenFromTo, { from: { opacity: 0 }, to: { opacity: 1 }, duration: 300 }, () =>
              h('div', { class: 'fromto-item' }),
            ),
          ]);
      },
    });

    const wrapper = mount(App);
    await nextTick();
    expect(wrapper.find('.fromto-item').exists()).toBe(true);
  });

  it('should clean up timeline on unmount', async () => {
    const timelineRef = ref<Record<string, (...args: unknown[]) => unknown> | null>(null);

    const App = defineComponent({
      setup() {
        return () =>
          h(TweenTimeline, { ref: timelineRef, autoPlay: false }, () =>
            h(TweenTo, { to: { opacity: 1 }, duration: 500, ease: linear }, () => h('div')),
          );
      },
    });

    const wrapper = mount(App);
    await nextTick();
    expect(timelineRef.value).toBeTruthy();
    wrapper.unmount();
  });

  it('should auto-play when autoPlay is true', async () => {
    const App = defineComponent({
      setup() {
        return () =>
          h(TweenTimeline, { autoPlay: true, defaults: { ease: linear } }, () => [
            h(TweenTo, { to: { opacity: 1 }, duration: 300 }, () =>
              h('div', { class: 'autoplay-item' }),
            ),
          ]);
      },
    });

    const wrapper = mount(App);
    await nextTick();
    expect(wrapper.find('.autoplay-item').exists()).toBe(true);
  });
});
