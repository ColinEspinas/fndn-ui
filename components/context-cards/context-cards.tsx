import { useState, type CSSProperties, type HTMLAttributes } from "react";
import { ArrowUpRight, TextAlignLeft } from "@phosphor-icons/react";
import { contextCards } from "./context-cards.recipe";
import { Count } from "../count/count";

export type ContextBadgeTone = "neutral" | "red" | "green" | "orange" | "accent";
export type ContextChunk = {
  title: string;
  chars: string;
  body: string;
  source: string;
  href?: string;
  badge: string;
  tone?: ContextBadgeTone;
};
export type ContextCardsProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> & {
  title?: string;
  count?: string;
  chunks: ContextChunk[];
  /** Enter on mount: the header fades in, the cards rise staggered. Off by default; set it on the set your code adds live, never on one rendered from history or with the page. Cards added later enter either way. */
  appear?: boolean;
};

/** Retrieved knowledge chunks with their sources. */
export function ContextCards({ title = "All chunks", count, chunks, appear = false, className, ...rest }: ContextCardsProps) {
  /* stagger only the cards that are here at first render (with appear); a card that arrives later enters at once */
  const [atMount] = useState(chunks.length);
  const [entrance] = useState(appear);
  const r = contextCards();
  return (
    <div data-slot="context-cards" className={r.base({ class: className })} {...rest}>
      <div data-slot="context-cards-header" className={r.header({ appear: entrance })}>
        <span data-slot="context-cards-title" className={r.title()} title={title}>{title}</span>
        {count !== undefined && <Count variant="boxed">{count}</Count>}
      </div>
      {chunks.map((c, i) => (
        <div key={`${i}-${c.title}`} data-slot="context-cards-card" className={r.card({ appear: entrance || i >= atMount })} style={i < atMount ? ({ "--fndn-row-index": i } as CSSProperties) : undefined}>
          <div data-slot="context-cards-bar" className={r.bar()}>
            <span data-slot="context-cards-card-title" className={r.cardTitle()}>
              <TextAlignLeft data-slot="icon" weight="bold" aria-hidden />
              <span title={c.title}>{c.title}</span>
            </span>
            <span data-slot="context-cards-chars" className={r.chars()}>{c.chars}</span>
          </div>
          <p data-slot="context-cards-body" className={r.body()}>{c.body}</p>
          <div data-slot="context-cards-footer" className={r.footer()}>
            <a data-slot="context-cards-source" className={r.source()} href={c.href ?? "#"} target={c.href ? "_blank" : undefined} rel={c.href ? "noreferrer" : undefined}>
              <span data-slot="context-cards-badge" className={r.badge({ tone: c.tone ?? "neutral" })} aria-hidden>{c.badge}</span>
              <span data-slot="context-cards-source-name" className={r.sourceName()} title={c.source}>{c.source}</span>
              <ArrowUpRight data-slot="icon" weight="bold" aria-hidden />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
