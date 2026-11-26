import { Check } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { afterPaint } from "../lib/paint";
import { truncationTitles } from "../lib/truncate";
import { statusPill } from "./status-pill.recipe";

export type StatusPillTone = "neutral" | "accent" | "green" | "orange" | "red" | "blue";
export type StatusPillSize = "md" | "sm";
export type StatusPillDotTone = "accent" | "green" | "orange" | "red" | "blue" | "purple" | "cyan" | "yellow" | "pink";
export type StatusPillProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: StatusPillTone;
  size?: StatusPillSize;
  /** Leading dot. Default: true. */
  dot?: boolean;
  /** Circle with a check in place of the dot, for a finished state; it pops in when it appears after the first paint. */
  mark?: boolean;
  /** A glyph after the label (a retry arrow). */
  trailingIcon?: ReactNode;
  /** A neutral pill whose dot alone takes this colour (a category). */
  dotTone?: StatusPillDotTone;
};

/** Tinted pill with a leading status dot. */
export function StatusPill({ tone = "neutral", size = "md", dot = true, mark, trailingIcon, dotTone, className, children, ...rest }: StatusPillProps) {
  const showDot = !mark && dot;
  const label = useRef<HTMLSpanElement>(null);
  const hasLabel = children != null && children !== false;
  /* a label cut by its ellipsis carries its full text as a title */
  useEffect(() => truncationTitles(label.current), [hasLabel]);
  /* the mark pops in only when it appears after the first paint: data-enter only after it (lib/paint.ts) */
  const [enter, setEnter] = useState(false);
  useEffect(() => (enter ? undefined : afterPaint(() => setEnter(true))), [enter]);
  const r = statusPill({ tone, size, dotTone, mark: !!mark });
  return (
    <span
      data-slot="status-pill"
      className={r.base({ class: className })}
      data-enter={enter ? "" : undefined}
      {...rest}
    >
      {mark && <span data-slot="status-pill-mark" className={r.mark()} aria-hidden="true"><Check data-slot="icon" weight="bold" /></span>}
      {showDot && <span data-slot="status-pill-dot" className={r.dot()} aria-hidden="true" />}
      {hasLabel && <span ref={label} data-slot="status-pill-label" className={r.label()}>{children}</span>}
      {trailingIcon && <span data-slot="status-pill-trailing" className={r.trailing()} aria-hidden="true">{trailingIcon}</span>}
    </span>
  );
}
