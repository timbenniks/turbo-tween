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

  useEffect(() => {
    if (register) {
      register({
        mode: 'to' as const,
        getTarget: () => elRef.current!,
        duration,
        getOptions: () => ({ ...to, ease, delay }),
      });
      return;
    }

    if (elRef.current) {
      tweenTo(elRef.current, duration, { ...to, ease, delay });
    }
  }, []);

  const child = Children.only(children);
  if (!isValidElement(child)) return null;
  return cloneElement(child, { ref: elRef } as Record<string, unknown>);
}
