import {
  defineComponent,
  ref,
  cloneVNode,
  onMounted,
  inject,
  type PropType,
  type VNode,
} from 'vue';
import type { EasingFunction } from '../types';
import { useTween } from './useTween';
import { TIMELINE_KEY, type TimelineRegisterFn } from './TweenTimeline';

export const TweenFrom = defineComponent({
  name: 'TweenFrom',
  props: {
    duration: { type: Number, default: 500 },
    from: { type: Object as PropType<Record<string, unknown>>, required: true },
    ease: { type: Function as PropType<EasingFunction>, default: undefined },
    delay: { type: Number, default: 0 },
  },
  setup(props, { slots }) {
    const elRef = ref<HTMLElement | null>(null);
    const register = inject<TimelineRegisterFn | null>(TIMELINE_KEY, null);

    if (register) {
      register({
        mode: 'from',
        getTarget: () => elRef.value!,
        duration: props.duration,
        getOptions: () => ({ ...props.from, ease: props.ease, delay: props.delay }),
      });
    } else {
      const { from } = useTween();
      onMounted(() => {
        if (elRef.value) {
          from(elRef.value, props.duration, {
            ...props.from,
            ease: props.ease,
            delay: props.delay,
          });
        }
      });
    }

    return () => {
      const children = slots.default?.();
      if (!children?.[0]) return null;
      return cloneVNode(children[0] as VNode, { ref: elRef });
    };
  },
});
