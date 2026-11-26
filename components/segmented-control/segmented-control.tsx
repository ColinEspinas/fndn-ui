"use client";
import { SegmentGroup } from "@ark-ui/react/segment-group";
import { useEffect, useLayoutEffect, useRef, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { trackModality } from "../lib/modality";
import { scrollSelected } from "./segmented-control.logic";
import { Count } from "../count/count";
import { segmentedControl } from "./segmented-control.recipe";

export type SegmentedOption = {
  value: string;
  /** Text of the segment. With `icons` it is not shown but stays the accessible name. */
  label?: ReactNode;
  /** Icon before the label, e.g. <Sun data-slot="icon" weight="fill" aria-hidden />. */
  icon?: ReactNode;
  disabled?: boolean;
  /** Status dot inside the label: a tag hue, or true for a neutral (ink-3) dot. */
  dot?: SegmentedDotTone | true;
  /** Count inside the label, after the text (a plain Count). */
  count?: number | string;
};

export type SegmentedDotTone = "blue" | "green" | "orange" | "red" | "purple" | "cyan" | "yellow" | "pink";

export type SegmentedControlProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | "dir"> & {
  /** Segments in order. Strings are accepted as value = label. */
  options: ReadonlyArray<string | SegmentedOption>;
  /** Controlled value. Omit for uncontrolled (use defaultValue; defaults to the first option). */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** segments: on a field track (default). chips: separate 26px chips with a gap, for a filter row; size does not apply. */
  variant?: "segments" | "chips";
  /** sm: 24px compact switcher (default). md: 32px control. */
  size?: "xs" | "sm" | "md" | "lg";
  /** pill: fully round. rounded: a field's corners, for squarer chrome. Left out, the app's shape (a pill, or rounded in a rounded app: "shape": "rounded" in the project's fndn.json). */
  shape?: "pill" | "rounded";
  /** Equal-width segments that share the root's width. */
  fill?: boolean;
  /** Icon-only square segments; labels stay as accessible names. */
  icons?: boolean;
  disabled?: boolean;
  /** Form field name of the radios. */
  name?: string;
};

/** Pick one of a few options side by side. A radio group, by Ark UI (Zag radio-group). */
export function SegmentedControl({
  options, value, defaultValue, onValueChange, variant = "segments", size = "md", shape, fill, icons, disabled, name, className, onKeyDown, ...rest
}: SegmentedControlProps) {
  const opts = options.map((o): SegmentedOption => (typeof o === "string" ? { value: o, label: o } : { label: o.value, ...o }));
  useEffect(() => trackModality(), []);
  /* labels are never cut: options that do not fit scroll sideways, the selected one kept in view (segmented-control.logic.ts) */
  const root = useRef<HTMLDivElement>(null);
  /* before the first paint: the thumb and data-overflow are measured with the first frame */
  useLayoutEffect(() => scrollSelected(root.current), []);

  /* Home / End are not part of the native radio keys */
  const homeEnd = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || (event.key !== "Home" && event.key !== "End")) return;
    const inputs = Array.from(event.currentTarget.querySelectorAll<HTMLInputElement>('input[type="radio"]:not(:disabled)'));
    const target = event.key === "Home" ? inputs[0] : inputs[inputs.length - 1];
    if (!target) return;
    event.preventDefault();
    target.focus();
    target.click();
  };

  const r = segmentedControl({ variant, size, shape, fill: !!fill, icons: !!icons });
  return (
    <SegmentGroup.Root
      ref={root}
      data-slot="segmented-control"
      className={r.base({ class: className })}
      orientation="horizontal"
      value={value}
      defaultValue={value === undefined ? (defaultValue ?? opts.find((o) => !o.disabled)?.value) : undefined}
      onValueChange={(details) => { if (details.value != null) onValueChange?.(details.value); }}
      disabled={disabled}
      name={name}
      onKeyDown={homeEnd}
      {...rest}
    >
      <SegmentGroup.Indicator data-slot="segmented-control-thumb" className={r.thumb()} />
      {opts.map((o) => (
        <SegmentGroup.Item key={o.value} value={o.value} disabled={o.disabled} data-slot="segmented-control-option" className={r.option()}>
          {o.icon}
          <SegmentGroup.ItemText data-slot="segmented-control-label" className={r.label()}>
            {o.dot && <span data-slot="segmented-control-dot" className={r.dot({ tone: o.dot === true ? "none" : o.dot })} aria-hidden="true" />}
            {o.label}
            {o.count != null && <>{" "}<Count>{`${o.count}`}</Count></>}
          </SegmentGroup.ItemText>
          <SegmentGroup.ItemHiddenInput data-slot="segmented-control-input" className={r.input()} />
        </SegmentGroup.Item>
      ))}
    </SegmentGroup.Root>
  );
}
