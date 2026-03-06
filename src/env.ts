/** Check if we're running in a browser environment */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/** Safe requestAnimationFrame that returns a no-op ID on server */
export function requestFrame(callback: FrameRequestCallback): number {
  if (typeof requestAnimationFrame !== 'undefined') {
    return requestAnimationFrame(callback);
  }
  return 0;
}

/** Safe cancelAnimationFrame that no-ops on server */
export function cancelFrame(id: number): void {
  if (typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(id);
  }
}

/** Safe performance.now() that returns 0 on server */
export function now(): number {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now();
  }
  if (typeof Date !== 'undefined') {
    return Date.now();
  }
  return 0;
}
