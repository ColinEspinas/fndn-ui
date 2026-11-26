"use client";
import { Collapsible as ArkCollapsible } from "@ark-ui/react/collapsible";
import { CaretRight } from "@phosphor-icons/react";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { collapsible } from "./collapsible.recipe";
import { trackModality } from "../lib/modality";
import { truncationTitles } from "../lib/truncate";

export type CollapsibleProps = {
  /** Controlled open state. Omit for uncontrolled (use defaultOpen). */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  /** row: a whole row is the trigger. inline: a text-sized header on the text line. section: a quiet section header. */
  variant?: "row" | "inline" | "section";
  /** Where the caret sits in the trigger. */
  caret?: "start" | "end" | "none";
  /** The trigger's content. */
  label?: ReactNode;
  /** Trailing muted note in the trigger. */
  meta?: ReactNode;
  /** Plain detail text, inset like the trigger. */
  detail?: ReactNode;
  /** The region's content (after the detail text). */
  children?: ReactNode;
  /** A closed region stays laid out at zero height (invisible, out of the tab order) instead of
   * display: none, so entrances inside it do not replay when it reopens. */
  keepLayout?: boolean;
  /** A class added to the trigger (a host's hook). */
  triggerClass?: string;
  /** A class added to the label part (a host's hook). */
  labelClass?: string;
  className?: string;
  style?: CSSProperties;
  /** data-* attributes land on the root (a host marks it as one of its parts: data-task-rows="row"). */
  [data: `data-${string}`]: string | undefined;
};

/** A disclosure: a trigger and a region that reveals under it. Behaviour by Ark UI (Zag collapsible). */
export function Collapsible({
  open, defaultOpen, onOpenChange, disabled, variant = "row", caret = "end", label, meta, detail, children, keepLayout, triggerClass, labelClass, className, style, ...data
}: CollapsibleProps) {
  useEffect(() => trackModality(), []);
  /* a label cut by its ellipsis carries its full text as a title (inline, section: a row's label
   * wraps, so nothing is cut) */
  const labelEl = useRef<HTMLSpanElement>(null);
  useEffect(() => (variant === "row" ? undefined : truncationTitles(labelEl.current)), [variant]);
  const r = collapsible({ variant });
  const caretEl = <span data-slot="collapsible-caret" className={r.caret()} aria-hidden><CaretRight data-slot="icon" weight="bold" /></span>;
  return (
    <ArkCollapsible.Root
      {...data}
      data-slot="collapsible" className={r.base({ class: className })}
      style={style}
      data-keep-layout={keepLayout ? "" : undefined}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(details) => onOpenChange?.(details.open)}
      disabled={disabled}
    >
      <ArkCollapsible.Trigger data-slot="collapsible-trigger" className={r.trigger({ class: triggerClass })}>
        {caret === "start" && caretEl}
        <span ref={labelEl} data-slot="collapsible-label" className={r.label({ class: labelClass })}>{label}</span>
        {meta != null && meta !== "" && <span data-slot="collapsible-meta" className={r.meta()}>{meta}</span>}
        {caret === "end" && caretEl}
      </ArkCollapsible.Trigger>
      <ArkCollapsible.Content data-slot="collapsible-content" className={r.content()}>
        <div data-slot="collapsible-body" className={r.body()}>
          {detail != null && detail !== "" && <p data-slot="collapsible-text" className={r.text()}>{detail}</p>}
          {children}
        </div>
      </ArkCollapsible.Content>
    </ArkCollapsible.Root>
  );
}
