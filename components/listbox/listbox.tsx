"use client";
import { Listbox as ArkListbox, createListCollection, useListboxContext } from "@ark-ui/react/listbox";
import { Check } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { glide } from "../lib/glide";
import { trackModality } from "../lib/modality";
import { listbox } from "./listbox.recipe";

export type ListboxItem = {
  value: string;
  label: string;
  /** One line after the label (an address, a cost): cut when the row is full, with a title. */
  description?: string;
  /** A leading icon: a Phosphor icon with data-slot="icon" weight="bold". */
  icon?: ReactNode;
  /** At the row's end: a note, a count, or a status letter (M, A, D). */
  meta?: string;
  /** The meta's colour: a status letter in its tone (orange modified, green added, red deleted). Default neutral (ink-2). */
  metaTone?: "neutral" | "accent" | "green" | "orange" | "red";
  disabled?: boolean;
};

export type ListboxProps = {
  /** Options in order. Strings are accepted as value = label. */
  items: ReadonlyArray<ListboxItem | string>;
  /** Controlled: the selected values (one at most in single mode). Omit for uncontrolled (defaultValue). */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** single: one value, a click replaces it. multiple: a click adds or removes. */
  selectionMode?: "single" | "multiple";
  /** Visible label. Without one, pass aria-label. */
  label?: ReactNode;
  "aria-label"?: string;
  /** Row height: xs 24 · sm 28 (dense: editors) · md 32 · lg 36. */
  size?: "xs" | "sm" | "md" | "lg";
  /** card: a box in the page (default). flush: no box, the list is part of its pane (a change list, an explorer). */
  variant?: "card" | "flush";
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/* one option. The engine marks its highlighted row only while the list has keyboard focus, and
 * its highlightOnHover waits for its own record of a press or a key, so the pointer alone would
 * never move the one highlight. Here a mouse move over an enabled row makes it the engine's
 * highlighted value (unless the last input was a key: a list scrolled by the keyboard under a
 * resting pointer keeps its highlight), and the row carries data-highlighted while it is that
 * value and the list is hovered or holds focus: the glide follows it. */
function Option({ item, r, active }: { item: ListboxItem; r: ReturnType<typeof listbox>; active: boolean }) {
  const api = useListboxContext();
  return (
    <ArkListbox.Item
      item={item}
      data-slot="listbox-item"
      className={r.item()}
      data-highlighted={active && api.highlightedValue === item.value ? "" : undefined}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse" || item.disabled || api.highlightedValue === item.value) return;
        if (document.documentElement.dataset.fndnInput === "keyboard") return;
        api.highlightValue(item.value);
      }}
    >
      {item.icon != null && <span data-slot="listbox-item-icon" className={r.itemIcon()} aria-hidden>{item.icon}</span>}
      <ArkListbox.ItemText data-slot="listbox-item-text" className={r.itemText()}>{item.label}</ArkListbox.ItemText>
      {item.description && <span data-slot="listbox-item-description" className={r.itemDescription()} title={item.description}>{item.description}</span>}
      {item.meta && <span data-slot="listbox-item-meta" className={r.itemMeta({ metaTone: item.metaTone })}>{item.meta}</span>}
      <span data-slot="listbox-item-indicator" className={r.itemIndicator()} aria-hidden><Check data-slot="icon" weight="bold" /></span>
    </ArkListbox.Item>
  );
}

/** A list of options laid in the page, single or multiple choice. Behaviour by Ark UI (Zag listbox). */
export function Listbox({
  items, value, defaultValue, onValueChange, selectionMode = "single", label, "aria-label": ariaLabel, size = "md", variant = "card", disabled, className, style, ...data
}: ListboxProps) {
  const collection = useMemo(
    () => createListCollection<ListboxItem>({ items: items.map((item) => (typeof item === "string" ? { value: item, label: item } : item)) }),
    [items],
  );
  const content = useRef<HTMLDivElement>(null);
  const highlight = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    trackModality();
    if (!content.current || !highlight.current) return;
    return glide(content.current, highlight.current, { rows: "[data-slot=listbox-item]", follow: "highlighted" });
  }, []);
  const r = listbox({ size, variant });
  /* hovered or focused: the list shows its highlight */
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <ArkListbox.Root
      {...data} data-slot="listbox"
      className={r.base({ class: className })}
      style={style}
      collection={collection}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(details) => onValueChange?.(details.value)}
      selectionMode={selectionMode}
      disabled={disabled}
    >
      {label && <ArkListbox.Label data-slot="listbox-label" className={r.label()}>{label}</ArkListbox.Label>}
      <ArkListbox.Content ref={content} data-slot="listbox-content" className={r.content()} aria-label={label ? undefined : ariaLabel}
        onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      >
        <span ref={highlight} data-slot="listbox-highlight" className={r.highlight()} aria-hidden />
        {collection.items.map((item) => <Option key={item.value} item={item} r={r} active={hovered || focused} />)}
      </ArkListbox.Content>
    </ArkListbox.Root>
  );
}
