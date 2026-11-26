"use client";
import { Progress as ArkProgress } from "@ark-ui/react/progress";
import { useId, type CSSProperties } from "react";
import { progress } from "./progress.recipe";

export type ProgressTone = "orange" | "green" | "red" | "accent";
export type ProgressSize = "sm" | "md";

export type ProgressProps = {
  /** Between min and max (clamped). null or omitted: indeterminate. */
  value?: number | null;
  min?: number;
  max?: number;
  /** Shown above the track at the start; names the progress bar. */
  label?: string;
  /** The progress bar's name when there is no visible label. */
  ariaLabel?: string;
  /** Shows the value above the track at the end ("42%"). */
  showValue?: boolean;
  /** Text shown as the value instead of the percentage ("3 of 8 files"); also aria-valuetext. */
  valueText?: string;
  tone?: ProgressTone;
  /** The track's height: sm 4px, md 6px. */
  size?: ProgressSize;
  className?: string;
  style?: CSSProperties;
  /** data-* attributes land on the root (a host marks it as one of its parts). */
  [data: `data-${string}`]: string | undefined;
};

/** A linear progress bar. Behaviour by Ark UI (Zag progress). */
export function Progress({
  value, min = 0, max = 100, label, ariaLabel = "Progress", showValue, valueText, tone = "orange", size = "md", className, style, ...data
}: ProgressProps) {
  const id = useId();
  const labelId = `${id}label`;
  const r = progress({ tone, size });
  const lo = Number.isFinite(min) ? min : 0;
  const hi = Number.isFinite(max) && max > lo ? max : lo + 100;
  /* omitted or not a number: indeterminate (Ark's own default would be 50) */
  const v = value == null || !Number.isFinite(value) ? null : Math.min(hi, Math.max(lo, value));
  const hasLabel = label != null && label !== "";
  return (
    <ArkProgress.Root
      {...data}
      data-slot="progress"
      className={r.base({ class: className })}
      style={style}
      value={v}
      min={lo}
      max={hi}
      ids={{ label: labelId }}
    >
      {hasLabel && <ArkProgress.Label data-slot="progress-label" className={r.label()}>{label}</ArkProgress.Label>}
      {showValue && v != null && (
        <ArkProgress.ValueText data-slot="progress-value" className={r.value()} aria-hidden aria-live={undefined}>{valueText}</ArkProgress.ValueText>
      )}
      <ArkProgress.Track
        data-slot="progress-track"
        className={r.track()}
        aria-label={hasLabel ? undefined : ariaLabel}
        aria-labelledby={hasLabel ? labelId : undefined}
        aria-valuetext={valueText}
      >
        <ArkProgress.Range data-slot="progress-range" className={r.range()} />
      </ArkProgress.Track>
    </ArkProgress.Root>
  );
}
