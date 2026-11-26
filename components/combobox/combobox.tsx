"use client";
import { Combobox as ArkCombobox, createListCollection } from "@ark-ui/react/combobox";
import { Portal } from "@ark-ui/react/portal";
import { CaretDown, Check } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { glide } from "../lib/glide";
import { trackModality } from "../lib/modality";
import { truncationTitles } from "../lib/truncate";
import { matchParts } from "./combobox.logic";
import { Button } from "../button/button";
import { combobox } from "./combobox.recipe";

export type ComboboxItem = {
  value: string;
  label: string;
  /** A leading icon: a Phosphor icon with data-slot="icon" weight="bold", or a 14px image (a favicon). */
  icon?: ReactNode;
  meta?: string;
  disabled?: boolean;
  /** Other words that find this option (an ISO code, a city, a former name); never shown. */
  keywords?: ReadonlyArray<string>;
};
export type ComboboxPlacement = "bottom-start" | "bottom" | "bottom-end" | "top-start" | "top" | "top-end";

export type ComboboxProps = {
  /** Options in order. Strings are accepted as value = label. */
  items: ReadonlyArray<ComboboxItem | string>;
  /** Controlled value. Omit for uncontrolled (use defaultValue). */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  onOpenChange?: (open: boolean) => void;
  /** Called with the text in the field as the user types. */
  onInputValueChange?: (text: string) => void;
  placeholder?: string;
  /** Visible label. Without one, pass aria-label. */
  label?: ReactNode;
  /** Before the text, inside the field: an icon, an avatar or a status. Decorative unless it carries its own label. */
  start?: ReactNode;
  /** After the text, inside the field, before the caret: a star, a status, a count. A control inside it (a Toggle) keeps its own press. */
  end?: ReactNode;
  /** The caret button at the end. false: the field opens its list by typing, a click or the arrow keys only. */
  caret?: boolean;
  /** The part of each label that matches what was typed stays in ink, the rest dims (Chrome's suggestions). */
  highlightMatch?: boolean;
  /** Enter with no option highlighted keeps what was typed as the value (valueChange fires with the text). */
  allowCustomValue?: boolean;
  "aria-label"?: string;
  /** Shown in the list when nothing matches. */
  emptyText?: string;
  /** aria-label of the caret button. */
  triggerLabel?: string;
  /** The shared control's sizes, dimensions only: xs 24px, sm 28px, md 32px, lg 36px. */
  size?: "xs" | "sm" | "md" | "lg";
  /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
  variant?: "outline" | "subtle" | "ghost";
  disabled?: boolean;
  invalid?: boolean;
  /** Form field name; the input carries it. */
  name?: string;
  placement?: ComboboxPlacement;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/** A select you can type into: the list is filtered by the text. Behaviour by Ark UI (Zag combobox). */
export function Combobox({
  items, value, defaultValue, onValueChange, onOpenChange, onInputValueChange, placeholder = "Search", label, "aria-label": ariaLabel, start, end,
  caret = true, highlightMatch = false, allowCustomValue = false, emptyText = "No results", triggerLabel = "Show options", size = "md", variant = "outline", disabled, invalid, name,
  placement = "bottom-start", className, style, ...data
}: ComboboxProps) {
  /* the value lives here when the caller does not hold it (as Vue's model and Svelte's bindable) */
  const [inner, setInner] = useState<string | null>(defaultValue ?? null);
  const current = value === undefined ? inner : value;
  const choose = (next: string | null) => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };
  const all = useMemo(() => {
    const list = items.map((item): ComboboxItem => (typeof item === "string" ? { value: item, label: item } : item));
    /* free text that was kept is an option of its own, so the field and the list show it */
    if (allowCustomValue && current && !list.some((item) => item.value === current)) list.push({ value: current, label: current });
    return list;
  }, [items, allowCustomValue, current]);
  /* the list filters on what the user typed, not on the label a selection writes into the field:
   * reopened after a choice, it shows every option again. A query matches the label or a keyword */
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? all.filter((item) => item.label.toLowerCase().includes(needle) || !!item.keywords?.some((word) => word.toLowerCase().includes(needle))) : all;
  }, [all, query]);
  const collection = useMemo(() => createListCollection<ComboboxItem>({ items: shown }), [shown]);

  const content = useRef<HTMLDivElement>(null);
  const highlight = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    trackModality();
    if (!content.current || !highlight.current) return;
    return glide(content.current, highlight.current, { rows: "[data-slot=combobox-item]", follow: "highlighted" });
  }, []);
  const hasStart = start != null && start !== false && start !== "";
  const hasEnd = end != null && end !== false && end !== "";
  const r = combobox({ size, variant, start: hasStart, end: hasEnd, caret });

  /* free text: Enter with no option highlighted keeps what was typed. Runs before the engine's
   * Enter (capture), which would put back the chosen label; an exact match of an option (a
   * disabled one too) is never kept as text */
  const keepTyped = (event: KeyboardEvent<HTMLInputElement>, close: () => void) => {
    if (!allowCustomValue || event.key !== "Enter" || event.nativeEvent.isComposing) return;
    const input = event.currentTarget;
    const text = input.value.trim();
    if (!text || input.hasAttribute("aria-activedescendant")) return;
    if (all.some((item) => item.label.toLowerCase() === text.toLowerCase())) return;
    event.preventDefault();
    choose(text);
    close();
  };
  /* a press on the start or end part (or the control's own padding) is a press in the field: focus,
   * then the field's click, which opens the list. A control inside them keeps its own press */
  const inField = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target !== event.currentTarget && (!target.closest("[data-slot=combobox-start], [data-slot=combobox-end]") || target.closest("a, button, input, select, textarea, [tabindex]"))) return null;
    return event.currentTarget.querySelector<HTMLInputElement>("[data-slot=combobox-input]");
  };
  const pressDown = (event: MouseEvent<HTMLDivElement>) => {
    const input = inField(event);
    if (!input) return;
    event.preventDefault();
    input.focus();
  };
  const pressUp = (event: MouseEvent<HTMLDivElement>) => inField(event)?.click();
  /* start text cut by its ellipsis carries its full text as a title */
  const control = useRef<HTMLDivElement>(null);
  useEffect(() => truncationTitles(control.current, "[data-slot=combobox-start]"), []);

  return (
    <ArkCombobox.Root
      {...data} data-slot="combobox"
      className={r.base({ class: className })}
      style={style}
      collection={collection}
      value={current == null ? [] : [current]}
      onValueChange={(details) => choose(details.value[0] ?? null)}
      onInputValueChange={(details) => {
        if (details.reason === "input-change") setQuery(details.inputValue);
        onInputValueChange?.(details.inputValue);
      }}
      onOpenChange={(details) => {
        /* the query is dropped when the list next opens (by anything but typing), not when it
         * closes: a closing list keeps the options it shows while it fades, it does not fill up again */
        if (details.open && details.reason !== "input-change") setQuery("");
        onOpenChange?.(details.open);
      }}
      /* nothing to choose from: the field is disabled rather than opening an empty list */
      disabled={disabled || items.length === 0}
      invalid={invalid}
      name={name}
      placeholder={placeholder}
      openOnClick
      inputBehavior="autohighlight"
      /* the engine's sameWidth pins the list to the control; off, the list grows to its options (the select's) */
      positioning={{ placement, gutter: 4, sameWidth: false }}
    >
      {label && <ArkCombobox.Label data-slot="combobox-label" className={r.label()}>{label}</ArkCombobox.Label>}
      <ArkCombobox.Context>
        {(api) => (
          <ArkCombobox.Control ref={control} data-slot="combobox-control" className={r.control()} onMouseDown={pressDown} onClick={pressUp}>
            {hasStart && <span data-slot="combobox-start" className={r.start()}>{start}</span>}
            <ArkCombobox.Input
              data-slot="combobox-input"
              className={r.input()}
              aria-label={ariaLabel}
              dir="auto"
              onKeyDownCapture={(event) => keepTyped(event, () => api.setOpen(false))}
            />
            {hasEnd && <span data-slot="combobox-end" className={r.end()}>{end}</span>}
            {caret && (
              <ArkCombobox.Trigger asChild aria-label={triggerLabel}>
                <Button
                  data-combobox="trigger"
                  className={r.trigger()}
                  variant="ghost"
                  size="xs"
                  square
                  muted
                  icon={<span data-slot="combobox-indicator" className={r.indicator()}><CaretDown data-slot="icon" weight="bold" /></span>}
                />
              </ArkCombobox.Trigger>
            )}
          </ArkCombobox.Control>
        )}
      </ArkCombobox.Context>
      <Portal>
        <ArkCombobox.Positioner data-slot="combobox-positioner" className={r.positioner()}>
          <ArkCombobox.Content ref={content} data-slot="combobox-content" className={r.content()}>
            <span ref={highlight} data-slot="combobox-highlight" className={r.highlight()} aria-hidden />
            {collection.items.map((item) => {
              const parts = highlightMatch ? matchParts(item.label, query) : null;
              return (
              <ArkCombobox.Item key={item.value} item={item} data-slot="combobox-item" className={r.item()}>
                {item.icon != null && <span data-slot="combobox-item-icon" className={r.itemIcon()} aria-hidden>{item.icon}</span>}
                <ArkCombobox.ItemText data-slot="combobox-item-text" className={r.itemText({ matching: !!parts })}>
                  {parts ? <>{parts[0]}<span data-slot="combobox-item-match" className={r.itemMatch()}>{parts[1]}</span>{parts[2]}</> : item.label}
                </ArkCombobox.ItemText>
                {item.meta && <span data-slot="combobox-item-meta" className={r.itemMeta()}>{item.meta}</span>}
                <span data-slot="combobox-item-indicator" className={r.itemIndicator()} aria-hidden><Check data-slot="icon" weight="bold" /></span>
              </ArkCombobox.Item>
              );
            })}
            <ArkCombobox.Empty data-slot="combobox-empty" className={r.empty()}>{emptyText}</ArkCombobox.Empty>
          </ArkCombobox.Content>
        </ArkCombobox.Positioner>
      </Portal>
    </ArkCombobox.Root>
  );
}
