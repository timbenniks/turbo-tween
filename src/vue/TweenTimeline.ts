import {
  defineComponent,
  provide,
  onMounted,
  onUnmounted,
  type PropType,
  type InjectionKey,
} from 'vue';
import type { EasingFunction } from '../types';
import { Timeline } from '../timeline';

export interface TweenEntry {
  mode: 'to' | 'from' | 'fromTo';
  getTarget: () => HTMLElement;
  duration: number;
  getOptions: () => Record<string, unknown>;
  getFromOptions?: () => Record<string, unknown>;
}

export type TimelineRegisterFn = (entry: TweenEntry) => void;

export const TIMELINE_KEY: InjectionKey<TimelineRegisterFn> = Symbol('turbo-tween-timeline');

export const TweenTimeline = defineComponent({
  name: 'TweenTimeline',
  props: {
    autoPlay: { type: Boolean, default: true },
    defaults: {
      type: Object as PropType<{ duration?: number; ease?: EasingFunction }>,
      default: undefined,
    },
  },
  emits: ['complete'],
  setup(props, { slots, emit, expose }) {
    const entries: TweenEntry[] = [];
    let timeline: Timeline | null = null;

    provide(TIMELINE_KEY, (entry: TweenEntry) => {
      entries.push(entry);
    });

    onMounted(() => {
      timeline = new Timeline({ defaults: props.defaults });

      for (const entry of entries) {
        const target = entry.getTarget();
        if (!target) continue;
        const opts = entry.getOptions();

        if (entry.mode === 'to') {
          timeline.to(target, entry.duration, opts);
        } else if (entry.mode === 'from') {
          timeline.from(target, entry.duration, opts);
        } else if (entry.mode === 'fromTo' && entry.getFromOptions) {
          timeline.fromTo(target, entry.duration, entry.getFromOptions(), opts);
        }
      }

      if (props.autoPlay) {
        timeline.play();
        void timeline.then(() => emit('complete'));
      }
    });

    onUnmounted(() => {
      timeline?.kill();
    });

    expose({
      play: () => timeline?.play(),
      pause: () => timeline?.pause(),
      resume: () => timeline?.resume(),
      reverse: () => timeline?.reverse(),
      seek: (timeMs: number) => timeline?.seek(timeMs),
      kill: () => timeline?.kill(),
      getTimeline: () => timeline,
    });

    return () => slots.default?.();
  },
});
