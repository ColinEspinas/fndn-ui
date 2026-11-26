/* The tree (left pane): a filter, Overview, Installation, Foundations, then Components and Blocks
 * (the spec's `kind`), each grouped by category, then Showcase and Guides (the Markdown of docs/). The current page is marked (aria-current). One tab stop for the
 * list (roving tabindex), arrow keys / Home / End to move, Enter to open (native link). On a phone
 * the pane is closed until the top bar's menu button opens it over the page. */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { EmptyState } from "@fndn/components/empty-state/empty-state.tsx";
import { Input } from "@fndn/components/input/input.tsx";
import { glide, glideLayer as glideClasses } from "@fndn/components/lib/glide.ts";
import { tv } from "@fndn/components/lib/tv.ts";
import { go, setOptions, usePath, useOptions } from "../lib/store";
import { FOUNDATIONS } from "../lib/types";
import "../lib/warm"; /* gets the next component page ready before it is shown */
import "../lib/live-reload"; /* dev: reloads this page when a file it shows is saved */

type Item = { name: string; title: string; status: string; category: string };
export type TreeSection = { heading: string; groups: { label: string; items: Item[] }[] };
type Row = { href: string; label: string; keywords: string };
type Group = { id: string; section?: string; label?: string; rows: Row[] };
/* the gliding highlight's layer, its classes merged with the tree's own (a control's radius) */
const highlight = tv({ base: glideClasses });

export default function Tree({ sections, guides = [], showcase = [], current: first }: { sections: TreeSection[]; guides?: { id: string; title: string }[]; showcase?: { name: string; title: string }[]; current: string }) {
  const o = useOptions();
  /* persisted across pages (transition:persist): the current page comes from the location */
  const current = usePath(first);
  const [q, setQ] = useState("");
  const glideLayer = useRef<HTMLSpanElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const filter = useRef<HTMLInputElement>(null);

  const groups = useMemo<Group[]>(() => [
    { id: "overview", rows: [{ href: "/", label: "Overview", keywords: "overview home" }, { href: "/installation", label: "Installation", keywords: "installation setup tailwind tv stylesheet" }] },
    { id: "foundations", label: "Foundations", rows: FOUNDATIONS.map(([id, label]) => ({ href: `/foundations/${id}`, label, keywords: `${label} foundations` })) },
    ...sections.flatMap((s) => s.groups.map((g, i): Group => ({
      id: `${s.heading}-${g.label}`,
      section: i === 0 ? s.heading : undefined,
      label: g.label,
      /* no status here: it is on the component's page (a "beta" on most rows was noise) */
      rows: g.items.map((x) => ({ href: `/components/${x.name}`, label: x.title, keywords: `${x.title} ${x.name} ${x.category} ${s.heading}` })),
    }))),
    ...(showcase.length ? [{ id: "showcase", section: "Showcase", rows: showcase.map((a) => ({ href: `/showcase/${a.name}`, label: a.title, keywords: `${a.title} ${a.name} showcase app` })) }] : []),
    ...(guides.length ? [{ id: "guides", section: "Guides", rows: guides.map((g) => ({ href: `/guides/${g.id}`, label: g.title, keywords: `${g.title} ${g.id} guides` })) }] : []),
  ], [sections, guides, showcase]);

  const needle = q.trim().toLowerCase();
  const shown = groups
    .map((g) => ({ ...g, rows: needle ? g.rows.filter((r) => r.keywords.toLowerCase().includes(needle)) : g.rows }))
    .filter((g) => g.rows.length);
  const flat = shown.flatMap((g) => g.rows);
  const stop = flat.find((r) => r.href === current)?.href ?? flat[0]?.href;

  /* The tree is kept across pages, but the router moves its element into the next document, and
   * a moved element loses its scroll position. Put it back as it was, so that clicking an item
   * never moves the list. */
  useEffect(() => {
    const pane = () => list.current?.closest<HTMLElement>("[data-docs-tree]");
    let saved = 0;
    const before = () => { saved = pane()?.scrollTop ?? 0; };
    const after = () => { const el = pane(); if (el) el.scrollTop = saved; };
    document.addEventListener("astro:before-swap", before);
    document.addEventListener("astro:after-swap", after);
    return () => { document.removeEventListener("astro:before-swap", before); document.removeEventListener("astro:after-swap", after); };
  }, []);

  /* the current row in view inside the pane, below the sticky filter, with its group's label (and
   * section heading) visible; nothing moves when it is in view already (a persisted tree keeps its
   * scroll position from page to page) */
  useEffect(() => {
    const pane = list.current?.closest<HTMLElement>("[data-docs-tree]");
    const row = list.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!pane || !row) return;
    const top = pane.getBoundingClientRect().top + (filter.current?.closest<HTMLElement>("[data-docs-filter]")?.offsetHeight ?? 0);
    const bottom = pane.getBoundingClientRect().bottom;
    const r = row.getBoundingClientRect();
    if (r.top >= top && r.bottom <= bottom) return;
    const head = row.closest<HTMLElement>("[data-docs-group]") ?? row;
    const h = head.getBoundingClientRect();
    /* the group's start, unless that would push the row out at the bottom */
    const target = r.bottom - h.top <= bottom - top ? h.top : r.top - 8;
    pane.scrollTop += target - top - 4;
  }, [current]);

  /* one gliding highlight under the pointer and keyboard focus (as sidebar-nav) */
  useEffect(() => {
    if (!list.current || !glideLayer.current) return;
    return glide(list.current, glideLayer.current, { rows: "a[data-row]", follow: "hover" });
  }, []);

  /* Escape closes the phone drawer */
  useEffect(() => {
    if (!o.treeOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") setOptions({ treeOpen: false }); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [o.treeOpen]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const rows = Array.from(list.current?.querySelectorAll<HTMLAnchorElement>("a[data-row]") ?? []);
    const i = rows.indexOf(document.activeElement as HTMLAnchorElement);
    if (i < 0) return;
    let next: HTMLElement | undefined;
    if (e.key === "ArrowDown") next = rows[Math.min(i + 1, rows.length - 1)];
    else if (e.key === "ArrowUp") next = i === 0 ? filter.current ?? undefined : rows[i - 1];
    else if (e.key === "Home") next = rows[0];
    else if (e.key === "End") next = rows[rows.length - 1];
    if (!next) return;
    e.preventDefault();
    if (next !== filter.current) { for (const r of rows) r.tabIndex = r === next ? 0 : -1; }
    next.focus();
  };

  return (
    <nav
      id="docs-tree"
      data-docs-tree
      aria-label="Site"
      className={`${o.treeOpen ? "fixed inset-x-0 top-12 bottom-0 z-20 block" : "hidden"} overflow-y-auto overscroll-contain [scrollbar-gutter:stable] bg-page md:sticky md:top-12 md:z-auto md:block md:h-[calc(100dvh-3rem)] md:border-e md:border-line`}
    >
      <div className="sticky top-0 z-10 bg-page px-3 pt-3 pb-2" data-docs-filter>
        <Input
          ref={filter as React.Ref<HTMLInputElement>}
          size="sm" type="search" placeholder="Filter" aria-label="Filter the tree" autoComplete="off" spellCheck={false}
          value={q}
          onChange={(e) => setQ((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); list.current?.querySelector<HTMLElement>("a[data-row]")?.focus(); }
            if (e.key === "Enter" && flat[0]) { e.preventDefault(); go(flat[0].href); }
            if (e.key === "Escape" && q) { e.preventDefault(); e.stopPropagation(); setQ(""); }
          }}
        />
      </div>
      <div ref={list} className="relative isolate mx-3 pb-6" onKeyDown={onKeyDown}>
        <span ref={glideLayer} className={highlight({ class: "rounded-control bg-hover invisible [@media(hover:hover)_and_(pointer:fine)]:visible" })} aria-hidden />
        {shown.map((g) => (
          <div key={g.id} data-docs-group>
            {/* headings and group titles sit above the gliding highlight, like the rows' text: it
              * glides behind them, never over them */}
            {g.section && <div className="relative z-1 mt-5 mb-1 px-2 text-xs font-semibold text-ink" role="presentation">{g.section}</div>}
            <div role="group" aria-label={g.label ? (g.section ? `${g.section}: ${g.label}` : g.label) : g.section} className={g.label && !g.section ? "mt-3" : g.section ? "" : "mt-0"}>
              {g.label && <div className="relative z-1 px-2 pt-1 pb-1 text-xs text-ink-2" aria-hidden>{g.label}</div>}
              {g.rows.map((r) => (
                <a
                  key={r.href}
                  data-row
                  href={r.href}
                  tabIndex={r.href === stop ? 0 : -1}
                  aria-current={r.href === current ? "page" : undefined}
                  className="relative z-1 mb-px flex min-h-8 scroll-mt-16 items-center py-1.5 gap-2 rounded-control px-2 text-sm font-medium text-ink-2 no-underline hover:text-ink aria-[current=page]:bg-hover-2 aria-[current=page]:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                >
                  <span className="min-w-0 flex-1">{r.label}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
        {!flat.length && <div role="status"><EmptyState title="No matches" icon="magnifying-glass" /></div>}
      </div>
    </nav>
  );
}
