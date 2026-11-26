"use client";
import { useEffect, useState, type HTMLAttributes } from "react";
import { loadingState } from "./loading-state.recipe";
import { Shimmer } from "../shimmer/shimmer";

export type LoadingStateVariant = "drive" | "dots" | "orbit";
export type LoadingStateProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  variant?: LoadingStateVariant;
  label?: string;
  /** Formatted elapsed time from the host; ticks from mount when omitted. */
  elapsed?: string;
  showElapsed?: boolean;
};

export function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 100) / 10;
  if (total < 60) return `${total.toFixed(1)}s`;
  const minutes = Math.floor(total / 60);
  /* past an hour the tenths stop meaning anything: 1h 12m */
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes}m ${(total % 60).toFixed(1)}s`;
}

function useElapsed(active: boolean) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = Date.now();
    const t = setInterval(() => setMs(Date.now() - start), 100);
    return () => clearInterval(t);
  }, [active]);
  return formatElapsed(ms);
}

/** Pixel-grid loader with a shimmering label and elapsed timer. */
export function LoadingState({ variant = "drive", label = "Loading", elapsed, showElapsed = true, className, ...rest }: LoadingStateProps) {
  const ticking = useElapsed(elapsed === undefined && showElapsed);
  const r = loadingState({ variant });
  return (
    <div role="status" aria-label={label} data-slot="loading-state" className={r.base({ class: className })} {...rest}>
      <span data-slot="loading-state-grid" className={r.grid()} aria-hidden>
        {Array.from({ length: 9 }, (_, i) => <span key={i} data-slot="loading-state-cell" className={r.cell()} />)}
      </span>
      <Shimmer data-loading-state="label" speed="fast" className={r.label()} title={label}>{label}</Shimmer>
      {/* the ticking time is not announced: the status region speaks its label */}
      {showElapsed && <span data-slot="loading-state-elapsed" className={r.elapsed()} aria-hidden>{elapsed ?? ticking}</span>}
    </div>
  );
}
