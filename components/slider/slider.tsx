"use client";
import { Slider as ArkSlider } from "@ark-ui/react/slider";
import { forwardRef, useEffect, useId, type CSSProperties } from "react";
import { trackModality } from "../lib/modality";
import { slider } from "./slider.recipe";

export type SliderSize = "sm" | "md";

export type SliderProps = {
  /** Controlled: one number per thumb ([40], or [20, 80] for a range), with onValueChange. Omit for uncontrolled (defaultValue). */
  value?: number[];
  defaultValue?: number[];
  /** While dragging and on every key. */
  onValueChange?: (value: number[]) => void;
  /** When a drag ends, or after a key. */
  onValueChangeEnd?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  /** A range: how many steps the two thumbs keep between them. */
  minStepsBetweenThumbs?: number;
  /** md: 24px control, 20px thumb (default). sm: 18px control, 14px thumb. */
  size?: SliderSize;
  /** Visible label, above at the start; names the thumbs. */
  label?: string;
  /** Show the value at the end of the label row. */
  showValue?: boolean;
  /** Formats each value, for the text shown and the text announced (aria-valuetext). */
  formatValue?: (value: number) => string;
  /** Names of the thumbs of a range, one per thumb. */
  thumbLabels?: string[];
  /** Form field name (the hidden inputs). */
  name?: string;
  disabled?: boolean;
  "aria-label"?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/** Pick a number, or a range, on a track. Behaviour by Ark UI (Zag slider). */
export const Slider = forwardRef<HTMLDivElement, SliderProps>(function Slider(
  {
    value, defaultValue, onValueChange, onValueChangeEnd, min = 0, max = 100, step = 1, minStepsBetweenThumbs, size = "md",
    label, showValue, formatValue, thumbLabels, name, disabled, "aria-label": ariaLabel, className, ...rest
  },
  ref,
) {
  useEffect(() => trackModality(), []);
  const r = slider({ size });
  /* the engine needs as many values as thumbs: the uncontrolled default is one thumb in the middle */
  const initial = value === undefined ? (defaultValue ?? [min + (max - min) / 2]) : undefined;
  const uid = useId();
  const thumbId = (index: number) => `${uid}-thumb-${index}`;
  /* a thumb with a name of its own (thumbLabels, or aria-label without a visible label) is named by
   * it alone: it labels itself, which reads its aria-label, instead of the shared label */
  const own = thumbLabels ?? (!label && ariaLabel != null ? (value ?? initial ?? [0]).map(() => ariaLabel) : undefined);
  const format = (v: number) => (formatValue ? formatValue(v) : String(v));
  return (
    <ArkSlider.Root
      ref={ref}
      data-slot="slider"
      className={r.base({ class: className })}
      value={value}
      defaultValue={initial}
      onValueChange={onValueChange ? (d) => onValueChange(d.value) : undefined}
      onValueChangeEnd={onValueChangeEnd ? (d) => onValueChangeEnd(d.value) : undefined}
      min={min}
      max={max}
      step={step}
      minStepsBetweenThumbs={minStepsBetweenThumbs}
      name={name}
      disabled={disabled}
      ids={{ thumb: thumbId }}
      aria-label={own ?? (ariaLabel != null ? [ariaLabel] : undefined)}
      aria-labelledby={own?.map((_, index) => thumbId(index))}
      getAriaValueText={formatValue ? ({ value: v }) => formatValue(v) : undefined}
      {...rest}
    >
      {label && <ArkSlider.Label data-slot="slider-label" className={r.label()}>{label}</ArkSlider.Label>}
      {showValue && (
        <ArkSlider.Context>
          {(api) => <ArkSlider.ValueText data-slot="slider-value-text" className={r.valueText()}>{api.value.map(format).join(" – ")}</ArkSlider.ValueText>}
        </ArkSlider.Context>
      )}
      <ArkSlider.Control data-slot="slider-control" className={r.control()}>
        <ArkSlider.Track data-slot="slider-track" className={r.track()}>
          <ArkSlider.Range data-slot="slider-range" className={r.range()} />
        </ArkSlider.Track>
        <ArkSlider.Context>
          {(api) =>
            api.value.map((_, index) => (
              <ArkSlider.Thumb
                key={index}
                index={index}
                data-slot="slider-thumb"
                className={r.thumb()}
              >
                <ArkSlider.HiddenInput data-slot="slider-hidden-input" />
              </ArkSlider.Thumb>
            ))
          }
        </ArkSlider.Context>
      </ArkSlider.Control>
    </ArkSlider.Root>
  );
});
