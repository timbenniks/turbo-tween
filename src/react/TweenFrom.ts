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

  useEffect(() => {
    if (register) {
      register({
        mode: 'from' as const,
        getTarget: () => elRef.current!,
        duration,
        getOptions: () => ({ ...from, ease, delay }),
      });
      return;
    }

    if (elRef.current) {
      tweenFrom(elRef.current, duration, { ...from, ease, delay });
    }
  }, []);

  const child = Children.only(children);
  if (!isValidElement(child)) return null;
  return cloneElement(child, { ref: elRef } as Record<string, unknown>);
}
