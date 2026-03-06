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

export const TweenFromTo = defineComponent({
  name: 'TweenFromTo',
  props: {
    duration: { type: Number, default: 500 },
    from: { type: Object as PropType<Record<string, unknown>>, required: true },
    to: { type: Object as PropType<Record<string, unknown>>, required: true },
    ease: { type: Function as PropType<EasingFunction>, default: undefined },
    delay: { type: Number, default: 0 },
  },
  setup(props, { slots }) {
    const elRef = ref<HTMLElement | null>(null);
    const register = inject<TimelineRegisterFn | null>(TIMELINE_KEY, null);

    if (register) {
      register({
        mode: 'fromTo',
        getTarget: () => elRef.value!,
        duration: props.duration,
        getOptions: () => ({ ...props.to, ease: props.ease, delay: props.delay }),
        getFromOptions: () => ({ ...props.from }),
      });
    } else {
      const { fromTo } = useTween();
      onMounted(() => {
        if (elRef.value) {
          fromTo(
            elRef.value,
            props.duration,
            { ...props.from },
            {
              ...props.to,
              ease: props.ease,
              delay: props.delay,
            },
          );
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
