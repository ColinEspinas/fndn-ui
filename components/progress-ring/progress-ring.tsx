import type { CSSProperties, HTMLAttributes } from "react";
import { progressRing } from "./progress-ring.recipe";

export type ProgressRingTone = "orange" | "green" | "red" | "accent";
export type ProgressRingSize = "sm" | "md";
export type ProgressRingProps = HTMLAttributes<HTMLSpanElement> & {
  /** 0..1. Out-of-range and non-finite values are clamped. */
  progress: number;
  tone?: ProgressRingTone;
  size?: ProgressRingSize;
  /** Accessible name of the progress bar. */
  label?: string;
};

const PX: Record<ProgressRingSize, number> = { sm: 24, md: 28 };

/** Small progress ring with content in the center. */
export function ProgressRing({ progress, tone = "orange", size = "md", label = "Progress", className, style, children, ...rest }: ProgressRingProps) {
  const px = PX[size];
  const r = (px - 2) / 2;
  const c = progressRing({ size, tone });
  const value = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      data-slot="progress-ring"
      className={c.base({ class: className })}
      style={{ "--fndn-progress": value, ...style } as CSSProperties}
      {...rest}
    >
      <svg data-slot="progress-ring-svg" className={c.svg()} viewBox={`0 0 ${px} ${px}`} aria-hidden>
        <circle data-slot="progress-ring-track" className={c.track()} cx={px / 2} cy={px / 2} r={r} pathLength={100} />
        <circle data-slot="progress-ring-bar" className={c.bar()} cx={px / 2} cy={px / 2} r={r} pathLength={100} />
      </svg>
      {children !== undefined && children !== null && <span data-slot="progress-ring-label" className={c.label()}>{children}</span>}
    </span>
  );
}
