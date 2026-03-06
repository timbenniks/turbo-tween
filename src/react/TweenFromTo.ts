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

  useEffect(() => {
    if (register) {
      register({
        mode: 'fromTo' as const,
        getTarget: () => elRef.current!,
        duration,
        getOptions: () => ({ ...to, ease, delay }),
        getFromOptions: () => ({ ...from }),
      });
      return;
    }

    if (elRef.current) {
      tweenFromTo(elRef.current, duration, { ...from }, { ...to, ease, delay });
    }
  }, []);

  const child = Children.only(children);
  if (!isValidElement(child)) return null;
  return cloneElement(child, { ref: elRef } as Record<string, unknown>);
}
