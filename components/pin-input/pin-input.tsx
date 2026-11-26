"use client";
import { PinInput as ArkPinInput } from "@ark-ui/react/pin-input";
import { forwardRef, useEffect, type CSSProperties } from "react";
import { Input } from "../input/input";
import { pinInput } from "./pin-input.recipe";
import { trackModality } from "../lib/modality";

export type PinInputSize = "xs" | "sm" | "md" | "lg";

export type PinInputProps = {
  /** Number of cells. */
  length?: number;
  /** Controlled: one character per cell ("" for an empty one), with onValueChange. Omit for uncontrolled (defaultValue). */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Every cell is filled: the code as one string. */
  onValueComplete?: (code: string) => void;
  /** What a cell accepts. */
  type?: "numeric" | "alphanumeric" | "alphabetic";
  /** A one-time code: autocomplete="one-time-code", so the keyboard can offer the code it received. */
  otp?: boolean;
  /** Shows dots instead of the characters (a PIN). */
  mask?: boolean;
  /** Square cells at the Input's heights: xs 24px, sm 28px, md 32px (default), lg 36px. */
  size?: PinInputSize;
  /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
  variant?: "outline" | "subtle" | "ghost";
  /** Visible label above the cells. */
  label?: string;
  /** Shown in an empty cell that does not have focus. Default: none. */
  placeholder?: string;
  /** Leaves the last cell when the code is complete. */
  blurOnComplete?: boolean;
  autoFocus?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  /** Form field name (one hidden input with the whole code). */
  name?: string;
  /** Name of the group when there is no visible label; each cell is "<name>, 2 of 6". */
  "aria-label"?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/** A code typed one character per cell. Behaviour by Ark UI (Zag pin-input). */
export const PinInput = forwardRef<HTMLDivElement, PinInputProps>(function PinInput(
  {
    length = 6, value, defaultValue, onValueChange, onValueComplete, type = "numeric", otp, mask, size = "md", variant = "outline", label, placeholder = "",
    blurOnComplete, autoFocus, invalid, disabled, name, "aria-label": ariaLabel, className, ...rest
  },
  ref,
) {
  const r = pinInput({ size });
  useEffect(() => trackModality(), []);
  const name_ = ariaLabel ?? label;
  return (
    <ArkPinInput.Root
      ref={ref}
      data-slot="pin-input"
      className={r.base({ class: className })}
      count={length}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (d) => onValueChange(d.value) : undefined}
      onValueComplete={onValueComplete ? (d) => onValueComplete(d.valueAsString) : undefined}
      type={type}
      otp={otp}
      mask={mask}
      placeholder={placeholder}
      blurOnComplete={blurOnComplete}
      autoFocus={autoFocus}
      invalid={invalid}
      disabled={disabled}
      name={name}
      translations={name_ ? { inputLabel: (index, count) => `${name_}, ${index + 1} of ${count}` } : undefined}
      {...rest}
    >
      {label && <ArkPinInput.Label data-slot="pin-input-label" className={r.label()}>{label}</ArkPinInput.Label>}
      <ArkPinInput.Control data-slot="pin-input-control" className={r.control()} role="group" aria-label={name_}>
        {Array.from({ length }, (_, index) => (
          <ArkPinInput.Input key={index} index={index} asChild>
            <Input data-pin-input="input" size={size} variant={variant} className={r.input()} />
          </ArkPinInput.Input>
        ))}
      </ArkPinInput.Control>
      <ArkPinInput.HiddenInput data-slot="pin-input-hidden-input" />
    </ArkPinInput.Root>
  );
});
