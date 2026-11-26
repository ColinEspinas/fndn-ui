"use client";
import { Portal } from "@ark-ui/react/portal";
import { Select as ArkSelect, createListCollection } from "@ark-ui/react/select";
import { CaretDown, Check } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { glide } from "../lib/glide";
import { trackModality } from "../lib/modality";
import { select } from "./select.recipe";

export type SelectItem = { value: string; label: string; meta?: string; disabled?: boolean };
export type SelectPlacement = "bottom-start" | "bottom" | "bottom-end" | "top-start" | "top" | "top-end";

export type SelectProps = {
  /** Options in order. Strings are accepted as value = label. */
  items: ReadonlyArray<SelectItem | string>;
  /** Controlled value. Omit for uncontrolled (use defaultValue). */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  /** Visible label. Without one, pass aria-label. */
  label?: ReactNode;
  "aria-label"?: string;
  /** The shared control's sizes, dimensions only: xs 24px, sm 28px, md 32px, lg 36px. */
  size?: "xs" | "sm" | "md" | "lg";
  /** The look, at every size: outline (the form field, as wide as its container), subtle (the
   * inspector), ghost (reads as text until touched, sized to its value: the model picker). */
  variant?: "outline" | "subtle" | "ghost";
  disabled?: boolean;
  invalid?: boolean;
  /** Form field name; renders a hidden native select. */
  name?: string;
  placement?: SelectPlacement;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/** Pick one value from a list. Behaviour by Ark UI (Zag select). */
export function Select({
  items, value, defaultValue, onValueChange, onOpenChange, placeholder = "Select", label, "aria-label": ariaLabel,
  size = "md", variant = "outline", disabled, invalid, name, placement = "bottom-start", className, style, ...data
}: SelectProps) {
  const collection = useMemo(
    () => createListCollection<SelectItem>({ items: items.map((item) => (typeof item === "string" ? { value: item, label: item } : item)) }),
    [items],
  );
  const content = useRef<HTMLDivElement>(null);
  const highlight = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    trackModality();
    if (!content.current || !highlight.current) return;
    return glide(content.current, highlight.current, { rows: "[data-slot=select-item]", follow: "highlighted" });
  }, []);
  const r = select({ size, variant });

  return (
    <ArkSelect.Root
      {...data} data-slot="select"
      className={r.base({ class: className })}
      style={style}
      collection={collection}
      value={value === undefined ? undefined : value === null ? [] : [value]}
      defaultValue={defaultValue == null ? undefined : [defaultValue]}
      onValueChange={(details) => onValueChange?.(details.value[0] ?? null)}
      onOpenChange={(details) => onOpenChange?.(details.open)}
      /* nothing to choose from: the trigger is disabled rather than opening an empty list */
      disabled={disabled || items.length === 0}
      invalid={invalid}
      name={name}
      positioning={{ placement, gutter: 4 }}
    >
      {label && <ArkSelect.Label data-slot="select-label" className={r.label()}>{label}</ArkSelect.Label>}
      <ArkSelect.Control data-slot="select-control" className={r.control()}>
        <ArkSelect.Trigger data-slot="select-trigger" className={r.trigger()} aria-label={ariaLabel}>
          <ArkSelect.ValueText data-slot="select-value" className={r.value()} placeholder={placeholder} />
          <span data-slot="select-indicator" className={r.indicator()} aria-hidden><CaretDown data-slot="icon" weight="bold" /></span>
        </ArkSelect.Trigger>
      </ArkSelect.Control>
      <Portal>
        <ArkSelect.Positioner data-slot="select-positioner" className={r.positioner()}>
          <ArkSelect.Content ref={content} data-slot="select-content" className={r.content()}>
            <span ref={highlight} data-slot="select-highlight" className={r.highlight()} aria-hidden />
            {collection.items.map((item) => (
              <ArkSelect.Item key={item.value} item={item} data-slot="select-item" className={r.item()}>
                <ArkSelect.ItemText data-slot="select-item-text" className={r.itemText()}>{item.label}</ArkSelect.ItemText>
                {item.meta && <span data-slot="select-item-meta" className={r.itemMeta()}>{item.meta}</span>}
                <span data-slot="select-item-indicator" className={r.itemIndicator()} aria-hidden><Check data-slot="icon" weight="bold" /></span>
              </ArkSelect.Item>
            ))}
          </ArkSelect.Content>
        </ArkSelect.Positioner>
      </Portal>
      {name && <ArkSelect.HiddenSelect />}
    </ArkSelect.Root>
  );
}
