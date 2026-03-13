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

export type TweenToProps = PropsWithChildren<{
  duration?: number;
  to: Record<string, unknown>;
  ease?: EasingFunction;
  delay?: number;
}>;

export function TweenTo({
  duration = 500,
  to,
  ease,
  delay = 0,
  children,
}: TweenToProps): ReactElement | null {
  const elRef = useRef<HTMLElement>(null);
  const register = useContext(TimelineContext);
  const { to: tweenTo } = useTween();
  const registerRef = useRef(register);
  const latestRef = useRef({ duration, to, ease, delay, tweenTo });

  registerRef.current = register;
  latestRef.current = { duration, to, ease, delay, tweenTo };

  useEffect(() => {
    const timelineRegister = registerRef.current;
    const current = latestRef.current;

    if (timelineRegister) {
      timelineRegister({
        mode: 'to' as const,
        getTarget: () => elRef.current!,
        duration: current.duration,
        getOptions: () => ({
          ...latestRef.current.to,
          ease: latestRef.current.ease,
          delay: latestRef.current.delay,
        }),
      });
      return;
    }

    if (elRef.current) {
      current.tweenTo(elRef.current, current.duration, {
        ...current.to,
        ease: current.ease,
        delay: current.delay,
      });
    }
  }, []);

  const child = Children.only(children);
  if (!isValidElement(child)) return null;
  return cloneElement(child, { ref: elRef } as Record<string, unknown>);
}
