"use client";
import { Accordion as ArkAccordion } from "@ark-ui/react/accordion";
import { CaretRight } from "@phosphor-icons/react";
import { useEffect, type CSSProperties, type ReactNode } from "react";
import { accordion } from "./accordion.recipe";
import { trackModality } from "../lib/modality";

export type AccordionItem = {
  value: string;
  /** The trigger's text (a node in React). */
  label: ReactNode;
  /** Trailing muted note in the trigger. */
  meta?: ReactNode;
  /** Plain detail text in the region, inset like the label. */
  detail?: ReactNode;
  /** Free content in the region, after the detail text. */
  content?: ReactNode;
  disabled?: boolean;
};

export type AccordionProps = {
  items: ReadonlyArray<AccordionItem>;
  /** Controlled: the values of the open items. Omit for uncontrolled (defaultValue). */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Several items may be open at once. */
  multiple?: boolean;
  /** The open item closes when its trigger is pressed again (default true). */
  collapsible?: boolean;
  /** plain: rows on the page. card: the rows in one surface card. */
  variant?: "plain" | "card";
  /** Where the caret sits in each trigger. */
  caret?: "start" | "end";
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  /** data-* attributes land on the root (a host marks it as one of its parts). */
  [data: `data-${string}`]: string | undefined;
};

/** A stack of disclosures, one open at a time unless multiple. Behaviour by Ark UI (Zag accordion). */
export function Accordion({
  items, value, defaultValue, onValueChange, multiple = false, collapsible = true, variant = "plain", caret = "end", disabled, className, style, ...data
}: AccordionProps) {
  useEffect(() => trackModality(), []);
  const r = accordion({ variant });
  const caretEl = <span data-slot="accordion-caret" className={r.caret()} aria-hidden><CaretRight data-slot="icon" weight="bold" /></span>;
  const shown = (v: ReactNode) => v != null && v !== false && v !== "";
  return (
    <ArkAccordion.Root
      {...data}
      data-slot="accordion"
      className={r.base({ class: className })}
      style={style}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(details) => onValueChange?.(details.value)}
      multiple={multiple}
      collapsible={collapsible}
      disabled={disabled}
    >
      {items.map((item) => (
        <ArkAccordion.Item key={item.value} value={item.value} disabled={item.disabled} data-slot="accordion-item" className={r.item()}>
          <ArkAccordion.ItemTrigger data-slot="accordion-trigger" className={r.trigger()}>
            {caret === "start" && caretEl}
            <span data-slot="accordion-label" className={r.label()}>{item.label}</span>
            {shown(item.meta) && <span data-slot="accordion-meta" className={r.meta()}>{item.meta}</span>}
            {caret === "end" && caretEl}
          </ArkAccordion.ItemTrigger>
          <ArkAccordion.ItemContent data-slot="accordion-content" className={r.content()}>
            <div data-slot="accordion-body" className={r.body()}>
              {shown(item.detail) && <p data-slot="accordion-text" className={r.text()}>{item.detail}</p>}
              {item.content}
            </div>
          </ArkAccordion.ItemContent>
        </ArkAccordion.Item>
      ))}
    </ArkAccordion.Root>
  );
}
