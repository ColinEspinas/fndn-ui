"use client";
import { Tabs as ArkTabs } from "@ark-ui/react/tabs";
import { X } from "@phosphor-icons/react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { trackModality } from "../lib/modality";
import { afterFirstPaint, closeDelay, focusTab, holdsFocus, neighbourTab, placeIndicator, revealTab, revealTabSoon } from "./tabs.logic";
import { tabs } from "./tabs.recipe";

export type TabsItem = {
  value: string; label?: ReactNode; content?: ReactNode; disabled?: boolean;
  /** Before the label: an icon element (a file icon: `<FileTs data-slot="icon" />`) or an image URL (a favicon). */
  icon?: ReactNode;
  /** This tab has a close button and closes on Delete. Overrides the Tabs' `closable`. */
  closable?: boolean;
};

export type TabsProps = {
  /** Tabs in order, each with its panel content. Strings are accepted as value = label. */
  items: ReadonlyArray<TabsItem | string>;
  /** Controlled value. Omit for uncontrolled (use defaultValue; defaults to the first enabled tab). */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** pill: selected tab on a filled pill (default). underline: ink bar under the selected tab.
   * attached: browser and editor tabs; the selected tab is the surface below it (--fndn-tabs-surface) and joins it. */
  variant?: "pill" | "underline" | "attached";
  /** xs 24 · sm 28 (dense: editors, browsers) · md (default). Dimensions only. */
  size?: "xs" | "sm" | "md";
  /** pill or underline inside a card header: the strip fills the header's height, with no hairline of its own. */
  inHeader?: boolean;
  /** Wraps the list in the header part (data-slot="tabs-header") with this class added: the host's header row. */
  headerClass?: string;
  /** Attributes for the header row, so a host can mark it as its own part (`{ "data-code-block": "header" }`). */
  headerProps?: Record<string, string | undefined>;
  /** Parts after the list inside the header part (a path, a copy button). Implies the header part. */
  end?: ReactNode;
  /** Every tab has a close button and closes on Delete (an item's own `closable` wins). */
  closable?: boolean;
  /** A tab asks to close (its button, or Delete / Backspace on it). Remove it from `items`: when it
   * was selected, the next tab (else the previous) is already selected through onValueChange. */
  onClose?: (value: string) => void;
  /** Verb of a close button's name, followed by the tab's text ("Close rate-limit.ts"). */
  closeLabel?: string;
  /** The root fills its container's height; the selected panel takes the rest and scrolls. */
  fill?: boolean;
  /** attached only. shrink (default, Chrome): tabs share the strip and shrink, labels cut with a title.
   * fit (VS Code): each tab as wide as its title, the strip scrolls. */
  tabSizing?: "shrink" | "fit";
  /** Name of the tab list. */
  "aria-label"?: string;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/** Switch between views that share one place. Behaviour by Ark UI (Zag tabs). */
export function Tabs({
  items, value, defaultValue, onValueChange, variant = "pill", size = "md", inHeader = false, headerClass, headerProps, end, closable = false, onClose,
  closeLabel = "Close", fill = false, tabSizing = "shrink", "aria-label": ariaLabel, className, style, ...data
}: TabsProps) {
  const opts = items.map((o): TabsItem => (typeof o === "string" ? { value: o, label: o } : { label: o.value, ...o }));
  /* the selection is held here when uncontrolled, so closing a tab can hand it to a neighbour */
  const [inner, setInner] = useState(() => defaultValue ?? opts.find((o) => !o.disabled)?.value);
  const current = value ?? inner;
  const select = (next: string) => { if (value === undefined) setInner(next); onValueChange?.(next); };
  /* after mount: from then on an inserted attached tab opens its room (nothing plays on first paint) */
  const [ready, setReady] = useState(false);
  useEffect(() => { trackModality(); return afterFirstPaint(() => setReady(true)); }, []);
  /* attached tabs closed by the pointer, while their room closes */
  const [closing, setClosing] = useState<ReadonlyArray<string>>([]);
  /* the indicator on the selected tab from the first paint (the engine measures a frame or more later) */
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { placeIndicator(root.current); revealTab(root.current, current, true); }, []);
  /* a strip that scrolls keeps the selected tab in view (also when a tab is added and selected) */
  const count = opts.length;
  const mounted = useRef(false);
  useEffect(() => { if (mounted.current) revealTabSoon(root.current, current); mounted.current = true; }, [current, count]);

  const close = (o: TabsItem, focus: boolean) => {
    const next = neighbourTab(opts, o.value);
    if (current === o.value && next !== undefined) select(next);
    if (focus || holdsFocus(root.current, o.value)) focusTab(root.current, next);
    /* attached, from the pointer: the tab closes its room first (instant from the keyboard) */
    const wait = variant === "attached" ? closeDelay(root.current, focus) : 0;
    if (wait === 0) { onClose?.(o.value); return; }
    setClosing((list) => [...list, o.value]);
    setTimeout(() => { setClosing((list) => list.filter((v) => v !== o.value)); onClose?.(o.value); }, wait);
  };
  const onTabKey = (o: TabsItem) => (event: KeyboardEvent) => {
    if ((event.key === "Delete" || event.key === "Backspace") && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      event.preventDefault();
      close(o, true);
    }
  };
  const label = (o: TabsItem) => (typeof o.label === "string" ? o.label : o.value);

  const r = tabs({ variant, size, inHeader, fill, tabSizing, ready });
  const list = (
    <ArkTabs.List data-slot="tabs-list" className={r.list()} aria-label={ariaLabel}>
      <ArkTabs.Indicator data-slot="tabs-indicator" className={r.indicator()} />
      {opts.map((o) => {
        const canClose = o.closable ?? closable;
        const leaving = closing.includes(o.value);
        const trigger = (
          <ArkTabs.Trigger
            key={o.value} value={o.value} disabled={o.disabled} data-slot="tabs-trigger" className={r.trigger({ closable: canClose, closing: leaving })}
            aria-keyshortcuts={canClose ? "Delete" : undefined} onKeyDown={canClose ? onTabKey(o) : undefined}
          >
            {o.icon != null && o.icon !== "" && (
              <span data-slot="tabs-icon" className={r.icon()} aria-hidden="true">{typeof o.icon === "string" ? <img src={o.icon} alt="" /> : o.icon}</span>
            )}
            <span data-slot="tabs-label" className={r.label()} title={typeof o.label === "string" ? o.label : undefined}>{o.label}</span>
          </ArkTabs.Trigger>
        );
        if (!canClose) return trigger;
        /* the close button sits beside the trigger (a button cannot hold a button); it is not a tab
         * stop (the keyboard closes with Delete, aria-keyshortcuts) but it is not hidden: a screen
         * reader's cursor and touch exploration reach it by its name. A press never takes focus, so
         * nothing is lost when its tab goes */
        return (
          <div key={o.value} data-slot="tabs-tab" className={r.tab({ closing: leaving })}>
            {trigger}
            <button
              type="button" data-slot="tabs-close" className={r.close()} tabIndex={-1} aria-label={`${closeLabel} ${label(o)}`}
              disabled={o.disabled}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => close(o, false)}
            >
              <X data-slot="icon" weight="bold" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </ArkTabs.List>
  );
  return (
    <ArkTabs.Root
      ref={root}
      {...data} data-slot="tabs" className={r.base({ class: className })}
      style={style}
      value={current}
      onValueChange={(details) => select(details.value)}
    >
      {headerClass !== undefined || end !== undefined ? (
        <div data-slot="tabs-header" {...headerProps} className={r.header({ class: headerClass })}>{list}{end}</div>
      ) : list}
      {opts.map((o) => (
        <ArkTabs.Content key={o.value} value={o.value} data-slot="tabs-content" className={r.content()}>{o.content}</ArkTabs.Content>
      ))}
    </ArkTabs.Root>
  );
}
