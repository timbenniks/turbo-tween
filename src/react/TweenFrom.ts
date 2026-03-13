import {
  useRef,
  useEffect,
  useContext,
  cloneElement,
  isValidElement,
  Children,
  type ReactElement,
  type PropsWithChildren,
} from 'react';
import type { EasingFunction } from '../types';
import { useTween } from './useTween';
import { TimelineContext } from './TweenTimeline';

export type TweenFromProps = PropsWithChildren<{
  duration?: number;
  from: Record<string, unknown>;
  ease?: EasingFunction;
  delay?: number;
}>;

export function TweenFrom({
  duration = 500,
  from,
  ease,
  delay = 0,
  children,
}: TweenFromProps): ReactElement | null {
  const elRef = useRef<HTMLElement>(null);
  const register = useContext(TimelineContext);
  const { from: tweenFrom } = useTween();
  const registerRef = useRef(register);
  const latestRef = useRef({ duration, from, ease, delay, tweenFrom });

  registerRef.current = register;
  latestRef.current = { duration, from, ease, delay, tweenFrom };

  useEffect(() => {
    const timelineRegister = registerRef.current;
    const current = latestRef.current;

    if (timelineRegister) {
      timelineRegister({
        mode: 'from' as const,
        getTarget: () => elRef.current!,
        duration: current.duration,
        getOptions: () => ({
          ...latestRef.current.from,
          ease: latestRef.current.ease,
          delay: latestRef.current.delay,
        }),
      });
      return;
    }

    if (elRef.current) {
      current.tweenFrom(elRef.current, current.duration, {
        ...current.from,
        ease: current.ease,
        delay: current.delay,
      });
    }
  }, []);

  const child = Children.only(children);
  if (!isValidElement(child)) return null;
  return cloneElement(child, { ref: elRef } as Record<string, unknown>);
}
