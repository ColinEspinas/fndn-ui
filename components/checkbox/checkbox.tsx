"use client";
import { Checkbox as ArkCheckbox } from "@ark-ui/react/checkbox";
import { Check, Minus } from "@phosphor-icons/react";
import { useEffect, type CSSProperties, type ReactNode } from "react";
import { trackModality } from "../lib/modality";
import { checkbox } from "./checkbox.recipe";

export type CheckboxChecked = boolean | "indeterminate";

export type CheckboxProps = {
  /** Controlled state. Omit for uncontrolled (use defaultChecked). */
  checked?: CheckboxChecked;
  defaultChecked?: CheckboxChecked;
  onCheckedChange?: (checked: CheckboxChecked) => void;
  /** Visible label. Without one, pass aria-label. */
  label?: ReactNode;
  "aria-label"?: string;
  /** sm: the 16px box (default). md: an 18px box, for table rows. */
  size?: "sm" | "md";
  /** Colour of the checked fill: ink (default), or red / green for a change to remove / add. */
  tone?: "ink" | "red" | "green";
  /** inline: box and label sized to the text (default). row: fills an option row (the shared option recipe) in a list that owns the glide. */
  layout?: "inline" | "row";
  disabled?: boolean;
  invalid?: boolean;
  /** tabIndex of the input (the focusable part), for a host that runs a roving tab stop. */
  tabIndex?: number;
  /** Form field name. */
  name?: string;
  /** Form value when checked. */
  value?: string;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/** Turn one option on or off. Behaviour by Ark UI (Zag checkbox). */
export function Checkbox({
  checked, defaultChecked, onCheckedChange, label, "aria-label": ariaLabel, size = "sm", tone = "ink", layout = "inline", disabled, invalid, tabIndex, name, value, className, style, ...data
}: CheckboxProps) {
  useEffect(() => trackModality(), []);
  const r = checkbox({ size, tone, layout });
  return (
    <ArkCheckbox.Root
      {...data} data-slot="checkbox" className={r.base({ class: className })}
      style={style}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={(details) => onCheckedChange?.(details.checked)}
      disabled={disabled}
      invalid={invalid}
      name={name}
      value={value}
    >
      <ArkCheckbox.Control data-slot="checkbox-control" className={r.control()}>
        <span data-slot="checkbox-mark" className={r.mark()} data-mark="check"><Check data-slot="icon" weight="bold" /></span>
        <span data-slot="checkbox-mark" className={r.mark()} data-mark="indeterminate"><Minus data-slot="icon" weight="bold" /></span>
      </ArkCheckbox.Control>
      {label != null && label !== false && <ArkCheckbox.Label data-slot="checkbox-label" className={r.label()}>{label}</ArkCheckbox.Label>}
      <ArkCheckbox.HiddenInput data-slot="checkbox-input" className={r.input()} aria-label={ariaLabel} tabIndex={tabIndex} />
    </ArkCheckbox.Root>
  );
}
