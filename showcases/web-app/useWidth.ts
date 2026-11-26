import { useCallback, useRef, useState } from "react";

/** The width of an element (a callback ref: the element may come and go), measured before the
 * first paint and on every change. */
export function useWidth() {
  const [width, setWidth] = useState(0);
  const observer = useRef<ResizeObserver>(null);
  const ref = useCallback((el: HTMLElement | null) => {
    observer.current?.disconnect();
    if (!el) return;
    setWidth(el.clientWidth);
    observer.current = new ResizeObserver(([e]) => e && setWidth(e.contentRect.width));
    observer.current.observe(el);
  }, []);
  return [ref, width] as const;
}
