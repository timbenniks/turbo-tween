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

export type TweenFromToProps = PropsWithChildren<{
  duration?: number;
  from: Record<string, unknown>;
  to: Record<string, unknown>;
  ease?: EasingFunction;
  delay?: number;
}>;

export function TweenFromTo({
  duration = 500,
  from,
  to,
  ease,
  delay = 0,
  children,
}: TweenFromToProps): ReactElement | null {
  const elRef = useRef<HTMLElement>(null);
  const register = useContext(TimelineContext);
  const { fromTo: tweenFromTo } = useTween();
  const registerRef = useRef(register);
  const latestRef = useRef({ duration, from, to, ease, delay, tweenFromTo });

  registerRef.current = register;
  latestRef.current = { duration, from, to, ease, delay, tweenFromTo };

  useEffect(() => {
    const timelineRegister = registerRef.current;
    const current = latestRef.current;

    if (timelineRegister) {
      timelineRegister({
        mode: 'fromTo' as const,
        getTarget: () => elRef.current!,
        duration: current.duration,
        getOptions: () => ({
          ...latestRef.current.to,
          ease: latestRef.current.ease,
          delay: latestRef.current.delay,
        }),
        getFromOptions: () => ({ ...latestRef.current.from }),
      });
      return;
    }

    if (elRef.current) {
      current.tweenFromTo(
        elRef.current,
        current.duration,
        { ...current.from },
        {
          ...current.to,
          ease: current.ease,
          delay: current.delay,
        },
      );
    }
  }, []);

  const child = Children.only(children);
  if (!isValidElement(child)) return null;
  return cloneElement(child, { ref: elRef } as Record<string, unknown>);
}
