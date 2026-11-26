"use client";
import { CaretRight, DotsThree } from "@phosphor-icons/react";
import { Fragment, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { Button } from "../button/button";
import { Menu } from "../menu/menu";
import { Tooltip } from "../tooltip/tooltip";
import { breadcrumb } from "./breadcrumb.recipe";

export type BreadcrumbItem = { label: string; href?: string };

export type BreadcrumbProps = {
  /** The trail from the top level to the current page (the last item). */
  items: ReadonlyArray<BreadcrumbItem>;
  /** Show at most this many items (2 or more): the first, a ⋯ menu, then the last maxItems − 1. */
  maxItems?: number;
  /** The landmark's accessible name. */
  label?: string;
  /** The ⋯ button's name and tooltip. */
  ellipsisLabel?: string;
  /** Replaces the browser's navigation (client routers); a click with a modifier key keeps the browser's. */
  onNavigate?: (href: string | undefined, item: BreadcrumbItem) => void;
  className?: string;
  style?: CSSProperties;
  /** data-* attributes land on the root (a host marks it as one of its parts). */
  [data: `data-${string}`]: string | undefined;
};

type Entry = { kind: "item"; item: BreadcrumbItem; current: boolean } | { kind: "ellipsis"; hidden: BreadcrumbItem[] };

/** The trail to the current page. */
export function Breadcrumb({ items, maxItems, label = "Breadcrumb", ellipsisLabel = "Show hidden pages", onNavigate, className, style, ...data }: BreadcrumbProps) {
  const r = breadcrumb();
  const n = items.length;
  const keep = maxItems != null && Number.isFinite(maxItems) ? Math.max(2, Math.floor(maxItems)) : n;
  const entries: Entry[] = n > keep
    ? [
        { kind: "item", item: items[0]!, current: false },
        { kind: "ellipsis", hidden: items.slice(1, n - (keep - 1)) },
        ...items.slice(n - (keep - 1)).map((item, i, rest): Entry => ({ kind: "item", item, current: i === rest.length - 1 })),
      ]
    : items.map((item, i) => ({ kind: "item", item, current: i === n - 1 }));

  const follow = (item: BreadcrumbItem) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (!onNavigate || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(item.href, item);
  };
  const pick = (hidden: BreadcrumbItem[]) => (value: string) => {
    const item = hidden[Number(value)];
    if (!item) return;
    if (onNavigate) onNavigate(item.href, item);
    else if (item.href) window.location.assign(item.href);
  };

  const step = (entry: Entry): ReactNode => {
    if (entry.kind === "ellipsis") {
      return (
        <Menu items={entry.hidden.map((item, i) => ({ value: String(i), label: item.label }))} onSelect={pick(entry.hidden)}>
          <Tooltip content={ellipsisLabel}>
            <Button data-breadcrumb="ellipsis" className={r.ellipsis()} variant="ghost" size="xs" square muted aria-label={ellipsisLabel} icon={<DotsThree data-slot="icon" weight="bold" />} />
          </Tooltip>
        </Menu>
      );
    }
    const { item, current } = entry;
    if (current) return <span data-slot="breadcrumb-page" className={r.page()} aria-current="page">{item.label}</span>;
    if (item.href == null) return <span data-slot="breadcrumb-link" className={r.link()}>{item.label}</span>;
    return <a data-slot="breadcrumb-link" className={r.link()} href={item.href} onClick={follow(item)}>{item.label}</a>;
  };

  return (
    <nav {...data} data-slot="breadcrumb" aria-label={label} className={r.base({ class: className })} style={style}>
      <ol data-slot="breadcrumb-list" className={r.list()}>
        {entries.map((entry, i) => (
          <Fragment key={i}>
            {i > 0 && (
              <li data-slot="breadcrumb-separator" className={r.separator()} role="presentation" aria-hidden>
                <CaretRight data-slot="icon" weight="bold" />
              </li>
            )}
            <li data-slot="breadcrumb-item" className={r.item()}>{step(entry)}</li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
