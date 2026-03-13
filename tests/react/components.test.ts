import { describe, it, expect } from 'vite-plus/test';
import { createElement, createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { TweenTo } from '../../src/react/TweenTo';
import { TweenFrom } from '../../src/react/TweenFrom';
import { TweenFromTo } from '../../src/react/TweenFromTo';
import { TweenTimeline, type TweenTimelineHandle } from '../../src/react/TweenTimeline';
import { linear } from '../../src/easings';

describe('React TweenTo component', () => {
  it('should render the child element', () => {
    render(
      createElement(
        TweenTo,
        { to: { opacity: 1 }, ease: linear },
        createElement('div', { 'data-testid': 'box' }, 'Hello'),
      ),
    );

    expect(screen.getByTestId('box')).toBeTruthy();
    expect(screen.getByText('Hello')).toBeTruthy();
  });
});

describe('React TweenFrom component', () => {
  it('should render the child element', () => {
    render(
      createElement(
        TweenFrom,
        { from: { opacity: 0 }, ease: linear },
        createElement('div', { 'data-testid': 'from-box' }, 'Hello'),
      ),
    );

    expect(screen.getByTestId('from-box')).toBeTruthy();
  });
});

describe('React TweenFromTo component', () => {
  it('should render the child element', () => {
    render(
      createElement(
        TweenFromTo,
        { from: { opacity: 0 }, to: { opacity: 1 }, ease: linear },
        createElement('div', { 'data-testid': 'fromto-box' }, 'Hello'),
      ),
    );

    expect(screen.getByTestId('fromto-box')).toBeTruthy();
  });
});

describe('React TweenTimeline component', () => {
  it('should render children', () => {
    render(
      createElement(
        TweenTimeline,
        { autoPlay: false, defaults: { ease: linear } },
        createElement(
          TweenTo,
          { to: { opacity: 1 }, duration: 500 },
          createElement('div', { 'data-testid': 'item1' }, 'Item 1'),
        ),
        createElement(
          TweenTo,
          { to: { opacity: 1 }, duration: 500 },
          createElement('div', { 'data-testid': 'item2' }, 'Item 2'),
        ),
      ),
    );

    expect(screen.getByTestId('item1')).toBeTruthy();
    expect(screen.getByTestId('item2')).toBeTruthy();
  });

  it('should expose timeline controls via ref', () => {
    const timelineRef = createRef<TweenTimelineHandle>();

    render(
      createElement(
        TweenTimeline,
        { ref: timelineRef, autoPlay: false, defaults: { ease: linear } },
        createElement(
          TweenTo,
          { to: { opacity: 1 }, duration: 500 },
          createElement('div', null, 'Box'),
        ),
      ),
    );

    expect(timelineRef.current).toBeTruthy();
    expect(typeof timelineRef.current?.play).toBe('function');
    expect(typeof timelineRef.current?.pause).toBe('function');
    expect(typeof timelineRef.current?.seek).toBe('function');
    expect(typeof timelineRef.current?.kill).toBe('function');
    expect(typeof timelineRef.current?.resume).toBe('function');
    expect(typeof timelineRef.current?.reverse).toBe('function');
    expect(typeof timelineRef.current?.getTimeline).toBe('function');
  });

  it('should invoke exposed handle methods without error', () => {
    const timelineRef = createRef<TweenTimelineHandle>();

    render(
      createElement(
        TweenTimeline,
        { ref: timelineRef, autoPlay: false, defaults: { ease: linear } },
        createElement(
          TweenTo,
          { to: { opacity: 1 }, duration: 500 },
          createElement('div', null, 'Box'),
        ),
      ),
    );

    const handle = timelineRef.current!;
    expect(() => handle.play()).not.toThrow();
    expect(() => handle.pause()).not.toThrow();
    expect(() => handle.resume()).not.toThrow();
    expect(() => handle.reverse()).not.toThrow();
    expect(() => handle.seek(100)).not.toThrow();
    expect(handle.getTimeline()).toBeTruthy();
    expect(() => handle.kill()).not.toThrow();
  });

  it('should register TweenFrom entries inside timeline', () => {
    render(
      createElement(
        TweenTimeline,
        { autoPlay: false, defaults: { ease: linear } },
        createElement(
          TweenFrom,
          { from: { opacity: 0 }, duration: 300 },
          createElement('div', { 'data-testid': 'tl-from' }, 'From'),
        ),
      ),
    );

    expect(screen.getByTestId('tl-from')).toBeTruthy();
  });

  it('should register TweenFromTo entries inside timeline', () => {
    render(
      createElement(
        TweenTimeline,
        { autoPlay: false, defaults: { ease: linear } },
        createElement(
          TweenFromTo,
          { from: { opacity: 0 }, to: { opacity: 1 }, duration: 300 },
          createElement('div', { 'data-testid': 'tl-fromto' }, 'FromTo'),
        ),
      ),
    );

    expect(screen.getByTestId('tl-fromto')).toBeTruthy();
  });

  it('should auto-play when autoPlay is true', () => {
    render(
      createElement(
        TweenTimeline,
        { autoPlay: true, defaults: { ease: linear } },
        createElement(
          TweenTo,
          { to: { opacity: 1 }, duration: 300 },
          createElement('div', { 'data-testid': 'autoplay' }, 'Auto'),
        ),
      ),
    );

    expect(screen.getByTestId('autoplay')).toBeTruthy();
  });

  it('should clean up on unmount', () => {
    const timelineRef = createRef<TweenTimelineHandle>();

    const { unmount } = render(
      createElement(
        TweenTimeline,
        { ref: timelineRef, autoPlay: false },
        createElement(
          TweenTo,
          { to: { opacity: 1 }, duration: 500, ease: linear },
          createElement('div', null, 'Box'),
        ),
      ),
    );

    expect(timelineRef.current).toBeTruthy();
    unmount();
  });
});
