import {
  createElement,
  createContext,
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
  type ReactNode,
} from 'react';
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

export const TimelineContext = createContext<TimelineRegisterFn | null>(null);

export interface TweenTimelineProps {
  autoPlay?: boolean;
  defaults?: { duration?: number; ease?: EasingFunction };
  onComplete?: () => void;
  children?: ReactNode;
}

export interface TweenTimelineHandle {
  play: () => void;
  pause: () => void;
  resume: () => void;
  reverse: () => void;
  seek: (timeMs: number) => void;
  kill: () => void;
  getTimeline: () => Timeline | null;
}

export const TweenTimeline = forwardRef<TweenTimelineHandle, TweenTimelineProps>(
  function TweenTimeline({ autoPlay = true, defaults, onComplete, children }, ref) {
    const entriesRef = useRef<TweenEntry[]>([]);
    const timelineRef = useRef<Timeline | null>(null);

    const register = useCallback<TimelineRegisterFn>((entry) => {
      entriesRef.current.push(entry);
    }, []);

    useImperativeHandle(ref, () => ({
      play: () => timelineRef.current?.play(),
      pause: () => timelineRef.current?.pause(),
      resume: () => timelineRef.current?.resume(),
      reverse: () => timelineRef.current?.reverse(),
      seek: (timeMs: number) => timelineRef.current?.seek(timeMs),
      kill: () => timelineRef.current?.kill(),
      getTimeline: () => timelineRef.current,
    }));

    useEffect(() => {
      const tl = new Timeline({ defaults });

      for (const entry of entriesRef.current) {
        const target = entry.getTarget();
        if (!target) continue;
        const opts = entry.getOptions();

        if (entry.mode === 'to') {
          tl.to(target, entry.duration, opts);
        } else if (entry.mode === 'from') {
          tl.from(target, entry.duration, opts);
        } else if (entry.mode === 'fromTo' && entry.getFromOptions) {
          tl.fromTo(target, entry.duration, entry.getFromOptions(), opts);
        }
      }

      if (autoPlay) {
        tl.play();
        tl.then(() => onComplete?.());
      }

      timelineRef.current = tl;

      return () => {
        tl.kill();
        entriesRef.current = [];
      };
    }, []);

    return createElement(TimelineContext.Provider, { value: register }, children);
  },
);
