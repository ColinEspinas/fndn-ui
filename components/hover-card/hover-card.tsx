"use client";
import { HoverCard as ArkHoverCard } from "@ark-ui/react/hover-card";
import { Portal } from "@ark-ui/react/portal";
import { useEffect, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { hoverCard } from "./hover-card.recipe";
import { trackModality } from "../lib/modality";
import { looksLikePath, middleTruncation } from "../lib/truncate";

export type HoverCardPlacement = "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "right";
/** One preformatted line of a preview; add and del lines are tinted and signed. */
export type HoverCardLine = { text: string; tone?: "ctx" | "add" | "del" };

export type HoverCardProps = {
  /** Controlled open state. Omit for uncontrolled (use defaultOpen). */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Header text, e.g. a file name. */
  title?: ReactNode;
  /** Lines added / removed, shown in the header. */
  add?: number;
  del?: number;
  /** Preformatted lines, e.g. a file diff. */
  lines?: ReadonlyArray<HoverCardLine>;
  placement?: HoverCardPlacement;
  openDelay?: number;
  closeDelay?: number;
  /** Your own trigger: one element. It receives the hover card's trigger props. */
  trigger?: ReactElement;
  /** Renders the default mono chip trigger with this label when no `trigger` is given. */
  triggerLabel?: string;
  /** Body content. */
  children?: ReactNode;
  className?: string;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

const SIGN = { ctx: " ", add: "+", del: "−" } as const;

/** A preview surface that opens on hover or focus. Behaviour by Ark UI (Zag hover-card). */
export function HoverCard({
  open, defaultOpen, onOpenChange, title, add, del, lines, placement = "bottom-start", openDelay = 500, closeDelay = 150,
  trigger, triggerLabel, children, className, ...data
}: HoverCardProps) {
  useEffect(() => trackModality(), []);
  /* the default trigger, when it names a file, is cut in the middle (full text in title) */
  const wrap = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => (trigger ? undefined : middleTruncation(wrap.current, ":scope > [data-slot=hover-card-trigger]", { when: looksLikePath })), [!!trigger]);
  const hasMeta = add !== undefined || del !== undefined;
  /* open when it mounted: drawn at once (the recipe skips the entrance) until it first closes */
  const [mountedOpen, setMountedOpen] = useState(Boolean(open ?? defaultOpen));
  if (mountedOpen && open === false) setMountedOpen(false);
  const r = hoverCard();
  return (
    <div ref={wrap} {...data} data-slot="hover-card" className={r.base({ class: className })}>
      <ArkHoverCard.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={(details) => { if (!details.open) setMountedOpen(false); onOpenChange?.(details.open); }}
        openDelay={openDelay}
        closeDelay={closeDelay}
        positioning={{ placement, gutter: 6 }}
      >
        <ArkHoverCard.Trigger asChild>
          {trigger ?? <button type="button" data-slot="hover-card-trigger" className={r.trigger()}>{triggerLabel}</button>}
        </ArkHoverCard.Trigger>
        <Portal>
          <ArkHoverCard.Positioner data-slot="hover-card-positioner" className={r.positioner()}>
            <ArkHoverCard.Content data-slot="hover-card-content" data-mounted-open={mountedOpen ? "" : undefined} className={r.content()}>
              {(title || hasMeta) && (
                <div data-slot="hover-card-header" className={r.header()}>
                  {title && <span data-slot="hover-card-title" className={r.title()}>{title}</span>}
                  {hasMeta && (
                    <span data-slot="hover-card-meta" className={r.meta()}>
                      {add !== undefined && <span data-slot="hover-card-add" className={r.add()}>{`+${add.toLocaleString()}`}</span>}
                      {del !== undefined && <span data-slot="hover-card-del" className={r.del()}>{`−${del.toLocaleString()}`}</span>}
                    </span>
                  )}
                </div>
              )}
              {lines && lines.length > 0 && (
                <div data-slot="hover-card-lines" className={r.lines()}>
                  {lines.map((line, i) => (
                    <div key={i} data-slot="hover-card-line" className={r.line({ tone: line.tone ?? "ctx" })}>
                      <span data-slot="hover-card-sign" className={r.sign()}>{SIGN[line.tone ?? "ctx"]}</span>
                      <span data-slot="hover-card-text" className={r.text()}>{line.text}</span>
                    </div>
                  ))}
                </div>
              )}
              {children && <div data-slot="hover-card-body" className={r.body()}>{children}</div>}
            </ArkHoverCard.Content>
          </ArkHoverCard.Positioner>
        </Portal>
      </ArkHoverCard.Root>
    </div>
  );
}
