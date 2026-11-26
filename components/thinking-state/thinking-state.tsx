"use client";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { Check, Globe, MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import { Collapsible } from "../collapsible/collapsible";
import { Shimmer } from "../shimmer/shimmer";
import { Spinner } from "../spinner/spinner";
import { thinkingState } from "./thinking-state.recipe";

export type ThinkingRow = {
  primary: string;
  secondary?: string;
  mono?: boolean;
  add?: number;
  del?: number;
  href?: string;
};
export type ThinkingVariant = "steps" | "reasoning" | "search" | "coding";

export type ThinkingStateProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  variant?: ThinkingVariant;
  working?: boolean;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  activeLabel?: string;
  doneLabel?: string;
  rows?: ThinkingRow[];
  /** search variant: the query shown above the sources */
  query?: string;
  /** search variant: trailer such as "+7 more" */
  more?: string;
  /** Rows are buttons with aria-pressed; defaults on for coding, or when onRowClick is given. */
  pressable?: boolean;
  /** Index of the pressed row, or null. Omit for local state (defaultSelected). */
  selected?: number | null;
  defaultSelected?: number | null;
  onSelectedChange?: (selected: number | null) => void;
  /** Replace the sparkle. */
  icon?: ReactNode;
  onRowClick?: (row: ThinkingRow, index: number) => void;
  /** Enter on mount: the rows present at mount fade up, staggered. Off by default; set it on the trace your code adds live, never on one rendered from history or with the page. Rows added later enter either way. */
  appear?: boolean;
};

const SparkleIcon = <Sparkle data-slot="icon" weight="fill" aria-hidden />;
const CheckIcon = <Check data-slot="icon" weight="bold" aria-hidden />;
const GlobeIcon = <Globe data-slot="icon" weight="bold" aria-hidden />;
const TONES = ["accent", "orange", "green"] as const;

/** Expandable agent trace, fully controlled. */
export function ThinkingState({
  variant = "steps", working = false, expanded, defaultExpanded = false, onExpandedChange,
  activeLabel = "Thinking", doneLabel = "Done thinking", rows = [], query, more, pressable,
  selected, defaultSelected = null, onSelectedChange, icon, onRowClick, appear = false, className, ...rest
}: ThinkingStateProps) {
  const [inner, setInner] = useState(defaultExpanded);
  const [innerSelected, setInnerSelected] = useState<number | null>(defaultSelected);
  const open = expanded ?? inner;
  const pressed = selected === undefined ? innerSelected : selected;
  const toggle = (n: boolean) => { if (expanded === undefined) setInner(n); onExpandedChange?.(n); };
  const isPressable = pressable ?? (variant === "coding" || Boolean(onRowClick));
  const showTitle = variant !== "reasoning";

  /* rows present at first render stagger in; a row that arrives later enters at once */
  const initial = useRef(rows.length).current;
  /* without appear, what is here at mount is simply there; what is added later enters */
  const atMount = useRef({ appear, query: Boolean(query), more: Boolean(more) }).current;
  const stagger = (i: number) => (i < initial ? ({ "--fndn-row-index": i } as CSSProperties) : undefined);

  /* status swaps animate, first paint does not: the ready variant arms the entry transitions */
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  /* rail: grow to meet a row that arrives; any other size change (wrapping, fonts) is instant */
  const rowsRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const list = rowsRef.current, line = lineRef.current;
    if (!list || !line) return;
    let lastCount = -1;
    const measure = () => {
      const count = list.childElementCount;
      const grow = lastCount !== -1 && count !== lastCount;
      if (!grow) line.style.transition = "none";
      line.style.height = `${list.offsetHeight + 2}px`;
      line.setAttribute("data-measured", "");
      if (!grow) { void line.offsetHeight; line.style.transition = ""; }
      lastCount = count;
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  const r = thinkingState({ variant, working, ready });
  return (
    <div data-slot="thinking-state" className={r.base({ class: className })} {...rest}>
      <Collapsible
        labelClass={r.header()}
        variant="inline"
        caret="start"
        keepLayout
        open={open}
        onOpenChange={toggle}
        label={
          <>
            <span data-slot="thinking-state-icon" className={r.icon()} aria-hidden>{icon ?? SparkleIcon}</span>
            <span data-slot="thinking-state-label" className={r.label()} role="status">
              {working
                ? <Shimmer key="working" data-thinking-state="label-text" speed="fast" className={r.labelText()} title={activeLabel}>{activeLabel}</Shimmer>
                : <span key="done" data-slot="thinking-state-label-text" className={r.labelText()} title={doneLabel}>{doneLabel}</span>}
            </span>
          </>
        }
      >
          <div data-slot="thinking-state-rail" className={r.rail()}>
            <span ref={lineRef} data-slot="thinking-state-line" className={r.line()} aria-hidden />
            <div ref={rowsRef} data-slot="thinking-state-rows" className={r.rows()}>
              {variant === "search" && query && (
                <div data-slot="thinking-state-query" className={r.query({ appear: atMount.appear || !atMount.query })}>
                  <MagnifyingGlass data-slot="icon" weight="bold" aria-hidden />
                  <span>{query}</span>
                </div>
              )}
              {rows.map((row, i) => {
                const last = i === rows.length - 1;
                const style = stagger(i);
                const content = (
                  <>
                    {variant === "steps" && (
                      <span data-slot="thinking-state-check" className={r.check()} aria-hidden>
                        {working && last ? <Spinner size="sm" decorative /> : CheckIcon}
                      </span>
                    )}
                    {variant === "search" && <span data-slot="thinking-state-dot" className={r.dot({ tone: TONES[i % 3] })} aria-hidden>{GlobeIcon}</span>}
                    <span data-slot="thinking-state-primary" className={r.primary()} title={showTitle ? row.primary : undefined}>{row.primary}</span>
                    {row.secondary && <span data-slot="thinking-state-secondary" className={r.secondary({ mono: !!row.mono })} title={row.secondary}>{row.secondary}</span>}
                    {(row.add !== undefined || row.del !== undefined) && (
                      <span data-slot="thinking-state-diff" className={r.diff()}>
                        {row.add !== undefined && <span data-add="">{`+${row.add}`}</span>}
                        {row.del !== undefined && <span data-del="">{`−${row.del}`}</span>}
                      </span>
                    )}
                  </>
                );
                if (row.href) return <a key={i} data-slot="thinking-state-row" className={r.row({ appear: atMount.appear || i >= initial })} href={row.href} target="_blank" rel="noreferrer" style={style}>{content}</a>;
                if (isPressable) {
                  const on = pressed === i;
                  return (
                    <button key={i} type="button" data-slot="thinking-state-row" className={r.row({ appear: atMount.appear || i >= initial })} aria-pressed={on} style={style}
                      onClick={() => {
                        const next = on ? null : i;
                        if (selected === undefined) setInnerSelected(next);
                        onSelectedChange?.(next);
                        onRowClick?.(row, i);
                      }}>
                      {content}
                    </button>
                  );
                }
                return <div key={i} data-slot="thinking-state-row" className={r.row({ appear: atMount.appear || i >= initial })} style={style}>{content}</div>;
              })}
              {variant === "search" && more && <span data-slot="thinking-state-more" className={r.more({ appear: atMount.appear || !atMount.more })} style={{ "--fndn-row-index": initial } as CSSProperties}>{more}</span>}
            </div>
          </div>
      </Collapsible>
    </div>
  );
}
