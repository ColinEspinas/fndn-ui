"use client";
import { NumberInput as ArkNumberInput } from "@ark-ui/react/number-input";
import { Minus, Plus } from "@phosphor-icons/react";
import { forwardRef, useEffect, type CSSProperties } from "react";
import { Button } from "../button/button";
import { Input } from "../input/input";
import { trackModality } from "../lib/modality";
import { numberInput } from "./number-input.recipe";

export type NumberInputSize = "xs" | "sm" | "md" | "lg";

export type NumberInputProps = {
  /** Controlled: the text of the field ("12", "" when empty), with onValueChange. Omit for uncontrolled (defaultValue). */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string, valueAsNumber: number) => void;
  /** After Enter, a blur or a step: the value the field settled on. */
  onValueCommit?: (value: string, valueAsNumber: number) => void;
  min?: number;
  max?: number;
  /** Arrow keys and the buttons move one step; Shift + arrow ten. */
  step?: number;
  /** The Input's heights: xs 24px, sm 28px, md 32px (default), lg 36px. */
  size?: NumberInputSize;
  /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
  variant?: "outline" | "subtle" | "ghost";
  /** Visible label above the field. */
  label?: string;
  placeholder?: string;
  /** Intl number format of the shown value (currency, percent, grouping). */
  formatOptions?: Intl.NumberFormatOptions;
  /** The wheel steps the value while the field has focus. */
  allowMouseWheel?: boolean;
  /** Names of the buttons. Default: "Decrease", "Increase". */
  decrementLabel?: string;
  incrementLabel?: string;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  /** Form field name. */
  name?: string;
  "aria-label"?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/** A number field with minus and plus buttons. Behaviour by Ark UI (Zag number-input). */
export const NumberInput = forwardRef<HTMLDivElement, NumberInputProps>(function NumberInput(
  {
    value, defaultValue, onValueChange, onValueCommit, min, max, step = 1, size = "md", variant = "outline", label, placeholder, formatOptions, allowMouseWheel,
    decrementLabel = "Decrease", incrementLabel = "Increase", invalid, disabled, readOnly, required, name, "aria-label": ariaLabel, className, ...rest
  },
  ref,
) {
  useEffect(() => trackModality(), []);
  const r = numberInput({ size });
  const button = size === "xs" ? 11 : size === "sm" ? 12 : 14;
  return (
    <ArkNumberInput.Root
      ref={ref}
      data-slot="number-input"
      className={r.base({ class: className })}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (d) => onValueChange(d.value, d.valueAsNumber) : undefined}
      onValueCommit={onValueCommit ? (d) => onValueCommit(d.value, d.valueAsNumber) : undefined}
      min={min}
      max={max}
      step={step}
      formatOptions={formatOptions}
      allowMouseWheel={allowMouseWheel}
      translations={{ decrementLabel, incrementLabel }}
      invalid={invalid}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      name={name}
      {...rest}
    >
      {label && <ArkNumberInput.Label data-slot="number-input-label" className={r.label()}>{label}</ArkNumberInput.Label>}
      <ArkNumberInput.Control data-slot="number-input-control" className={r.control()}>
        <ArkNumberInput.Input asChild>
          <Input data-number-input="input" size={size} variant={variant} className={r.input()} placeholder={placeholder} aria-label={ariaLabel} />
        </ArkNumberInput.Input>
        <ArkNumberInput.DecrementTrigger asChild>
          <Button
            data-number-input="decrement-trigger"
            className={r.decrementTrigger()}
            variant="ghost"
            size="xs"
            shape="rounded"
            square
            muted
            iconSize={button}
            icon={<Minus data-slot="icon" weight="bold" />}
          />
        </ArkNumberInput.DecrementTrigger>
        <ArkNumberInput.IncrementTrigger asChild>
          <Button
            data-number-input="increment-trigger"
            className={r.incrementTrigger()}
            variant="ghost"
            size="xs"
            shape="rounded"
            square
            muted
            iconSize={button}
            icon={<Plus data-slot="icon" weight="bold" />}
          />
        </ArkNumberInput.IncrementTrigger>
      </ArkNumberInput.Control>
    </ArkNumberInput.Root>
  );
});
