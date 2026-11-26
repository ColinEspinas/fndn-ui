"use client";
import { RadioGroup as ArkRadioGroup } from "@ark-ui/react/radio-group";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { glide } from "../lib/glide";
import { radioGroup } from "./radio-group.recipe";
import { trackModality } from "../lib/modality";

export type RadioGroupItem = { value: string; label?: ReactNode; disabled?: boolean };

export type RadioGroupProps = {
  /** Options in order. Strings are accepted as value = label. */
  items: ReadonlyArray<RadioGroupItem | string>;
  /** Controlled value. Omit for uncontrolled (use defaultValue). */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** Visible group label. Without one, pass aria-label. */
  label?: ReactNode;
  "aria-label"?: string;
  /** vertical: stacked options (default). horizontal: options in a row that wraps. */
  orientation?: "vertical" | "horizontal";
  /** inline: each control with its label (default). row: a list of option rows under one gliding highlight. */
  layout?: "inline" | "row";
  /** Row layout: adds a free-text row after the options with this placeholder (e.g. "Something else…"). */
  customPlaceholder?: string;
  /** Accessible name of the free-text field; defaults to the placeholder. */
  customLabel?: string;
  /** enterkeyhint of the free-text field ("next" when another step follows, "done", "send"…). */
  customEnterKeyHint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
  /** Controlled text of the free-text row. Typing makes the value null; picking an option empties it. */
  custom?: string;
  defaultCustom?: string;
  onCustomChange?: (text: string) => void;
  disabled?: boolean;
  /** Form field name of the radios. */
  name?: string;
  className?: string;
  style?: CSSProperties;
  /** data-* attributes land on the root (a host marks it as one of its parts: data-task-rows="row"). */
  [data: `data-${string}`]: string | undefined;
};

/* Home / End are not part of the native radio keys (the free-text field keeps them) */
function homeEnd(event: KeyboardEvent<HTMLDivElement>) {
  if (event.defaultPrevented || (event.key !== "Home" && event.key !== "End")) return;
  if (!(event.target as Element).matches?.('input[type="radio"]')) return;
  const inputs = Array.from(event.currentTarget.querySelectorAll<HTMLInputElement>('input[type="radio"]:not(:disabled)'));
  const target = event.key === "Home" ? inputs[0] : inputs[inputs.length - 1];
  if (!target) return;
  event.preventDefault();
  target.focus();
  target.click();
}

/** Pick exactly one of a short list. Behaviour by Ark UI (Zag radio-group). */
export function RadioGroup({
  items, value, defaultValue, onValueChange, label, "aria-label": ariaLabel, orientation = "vertical", layout = "inline",
  customPlaceholder, customLabel, customEnterKeyHint, custom, defaultCustom = "", onCustomChange, disabled, name, className, style, ...data
}: RadioGroupProps) {
  useEffect(() => trackModality(), []);
  const opts = items.map((o): RadioGroupItem => (typeof o === "string" ? { value: o, label: o } : { label: o.value, ...o }));
  const row = layout === "row";
  const [innerValue, setInnerValue] = useState<string | null>(defaultValue ?? null);
  const current = value !== undefined ? value : innerValue;
  const [innerCustom, setInnerCustom] = useState(defaultCustom);
  const text = custom ?? innerCustom;

  const changeValue = (next: string | null) => {
    if (value === undefined) setInnerValue(next);
    onValueChange?.(next);
    /* picking an option replaces a free-text answer */
    if (next != null && text) { if (custom === undefined) setInnerCustom(""); onCustomChange?.(""); }
  };
  const changeCustom = (next: string) => {
    if (custom === undefined) setInnerCustom(next);
    onCustomChange?.(next);
    /* a free-text answer replaces the selection */
    if (next && current != null) { if (value === undefined) setInnerValue(null); onValueChange?.(null); }
  };

  const r = radioGroup({ orientation, layout: row ? "row" : "inline" });
  const root = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!row || !root.current || !layer.current) return;
    return glide(root.current, layer.current, { rows: "[data-slot=radio-group-item], [data-slot=radio-group-custom]", follow: "hover" });
  }, [row]);

  return (
    <ArkRadioGroup.Root
      ref={root}
      {...data}
      data-slot="radio-group" className={r.base({ class: className })}
      style={style}
      aria-label={ariaLabel}
      orientation={orientation}
      value={current}
      onValueChange={(details) => changeValue(details.value)}
      disabled={disabled}
      name={name}
      onKeyDown={homeEnd}
    >
      {label != null && label !== false && <ArkRadioGroup.Label data-slot="radio-group-label" className={r.label()}>{label}</ArkRadioGroup.Label>}
      {row && <span ref={layer} data-slot="radio-group-highlight" className={r.highlight()} aria-hidden="true" />}
      {opts.map((o) => (
        <ArkRadioGroup.Item key={o.value} value={o.value} disabled={o.disabled} data-slot="radio-group-item" className={r.item()}>
          <ArkRadioGroup.ItemControl data-slot="radio-group-control" className={r.control()} />
          <ArkRadioGroup.ItemText data-slot="radio-group-item-text" className={r.itemText()}>{o.label}</ArkRadioGroup.ItemText>
          <ArkRadioGroup.ItemHiddenInput data-slot="radio-group-input" className={r.input()} />
        </ArkRadioGroup.Item>
      ))}
      {row && customPlaceholder != null && (
        <label data-slot="radio-group-custom" className={r.custom()}>
          <input
            data-slot="radio-group-custom-input" className={r.customInput()}
            dir="auto"
            type="text"
            placeholder={customPlaceholder}
            aria-label={customLabel ?? customPlaceholder}
            enterKeyHint={customEnterKeyHint}
            value={text}
            disabled={disabled}
            onChange={(e) => changeCustom(e.currentTarget.value)}
          />
        </label>
      )}
    </ArkRadioGroup.Root>
  );
}
