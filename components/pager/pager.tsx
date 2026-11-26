"use client";
import { CaretDown, CaretLeft, CaretRight, CaretUp } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { REEL, clampPage, pageAfter, pagerDigits, pagerEnds, pagerKey, pagerPosition, pagerSpoken, pagerTotal, type PagerAction } from "./pager.logic";
import { Tooltip } from "../tooltip/tooltip";
import { Button } from "../button/button";
import { pager, type PagerRecipeProps } from "./pager.recipe";

type PagerDigit = NonNullable<PagerRecipeProps["digit"]>;
import { trackModality } from "../lib/modality";

export type PagerProps = {
  /** Controlled page, 0-based. Omit for uncontrolled (use defaultPage). */
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /** Number of pages. */
  count: number;
  /** Wrap from the last page to the first and back; the buttons never disable. */
  loop?: boolean;
  /** Roll each digit of the position like a counter. */
  reel?: boolean;
  /** between: prev · position · next. start: position · prev · next. */
  layout?: "between" | "start";
  /** horizontal: left/right carets (mirrored right-to-left). vertical: up/down carets, Up/Down keys too. */
  orientation?: "horizontal" | "vertical";
  /** Visible: "of" ("2 of 3") or "/" ("2 / 3"). */
  separator?: string;
  /** What screen readers hear between page and count ("of"), whatever the visible separator. */
  spokenSeparator?: string;
  /** Read before the position by screen readers: "Question" → "Question 2 of 3". */
  unit?: string;
  /** The group's accessible name. */
  label?: string;
  prevLabel?: string;
  nextLabel?: string;
  /** Attributes for the previous button (a host ties it to what it pages: aria-controls). */
  prevProps?: Record<string, string | undefined>;
  /** Attributes for the next button. */
  nextProps?: Record<string, string | undefined>;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/** Previous · position · next. */
export function Pager({
  page, defaultPage = 0, onPageChange, count, loop = false, reel = false, layout = "between", orientation = "horizontal",
  separator = "of", spokenSeparator = "of", unit, label = "Pages", prevLabel = "Previous", nextLabel = "Next", prevProps, nextProps, className, style, ...data
}: PagerProps) {
  const [local, setLocal] = useState(defaultPage);
  const current = clampPage(page ?? local, count);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => trackModality(), []);
  const vertical = orientation === "vertical";
  const ends = pagerEnds(current, count, loop);
  const text = pagerPosition(current, count, separator);
  const spoken = pagerSpoken(current, count, spokenSeparator, unit);

  const go = (action: PagerAction) => {
    const to = pageAfter(action, current, count, loop);
    if (to === current) return;
    if (page === undefined) setLocal(to);
    onPageChange?.(to);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const rtl = root.current ? getComputedStyle(root.current).direction === "rtl" : false;
    const action = pagerKey(e.key, rtl, vertical);
    if (!action || count <= 1) return;
    e.preventDefault();
    go(action);
  };
  const r = pager({ layout, orientation });
  const Prev = vertical ? CaretUp : CaretLeft;
  const Next = vertical ? CaretDown : CaretRight;

  return (
    <div ref={root} {...data} data-slot="pager" className={r.base({ class: className })} style={style} role="group" aria-label={label} onKeyDown={onKeyDown}>
      <Tooltip content={prevLabel}>
        <Button {...prevProps} data-pager="prev" className={r.prev()} variant="ghost" size="sm" square muted icon={<Prev data-slot="icon" weight="bold" />} aria-label={prevLabel} aria-disabled={ends.prev ? undefined : "true"} onClick={() => ends.prev && go("prev")} />
      </Tooltip>
      {reel ? (
        <span data-slot="pager-position" className={r.position()} role="status">
          <span className="sr-only">{spoken}</span>
          <span data-slot="pager-digits" className={r.digits()} aria-hidden>
            {pagerDigits(current, count).map((d, i) => (
              <span key={i} data-slot="pager-digit" className={r.digit()}><span data-slot="pager-reel" className={r.reel({ digit: d as PagerDigit })}>{REEL.map((n) => <span key={n}>{n}</span>)}</span></span>
            ))}
          </span>
          <span data-slot="pager-total" className={r.total()} aria-hidden>{pagerTotal(count, separator)}</span>
        </span>
      ) : (
        spokenSeparator !== separator ? (
          <span data-slot="pager-position" className={r.position()} role="status"><span className="sr-only">{spoken}</span><span data-slot="pager-text" className={r.text()} aria-hidden>{text}</span></span>
        ) : (
          <span data-slot="pager-position" className={r.position()} role="status">{unit && <span className="sr-only">{`${unit} `}</span>}{text}</span>
        )
      )}
      <Tooltip content={nextLabel}>
        <Button {...nextProps} data-pager="next" className={r.next()} variant="ghost" size="sm" square muted icon={<Next data-slot="icon" weight="bold" />} aria-label={nextLabel} aria-disabled={ends.next ? undefined : "true"} onClick={() => ends.next && go("next")} />
      </Tooltip>
    </div>
  );
}
