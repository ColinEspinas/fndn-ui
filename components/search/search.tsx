"use client";
import { Combobox, createListCollection } from "@ark-ui/react/combobox";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { glide } from "../lib/glide";
import { filterRows, groupRows } from "./search.logic";
import { trackModality } from "../lib/modality";
import { Button } from "../button/button";
import { EmptyState } from "../empty-state/empty-state";
import { Kbd } from "../kbd/kbd";
import { search } from "./search.recipe";
import { Tooltip } from "../tooltip/tooltip";

export type SearchItem = {
  value: string; label: string;
  /** Rows of one group are listed together under this label, groups in the order they first appear. */
  group?: string;
  /** Leading icon (an element, e.g. <GitBranch data-slot="icon" weight="bold" />). */
  icon?: ReactNode;
  /** Trailing muted note (a path, a category). */
  meta?: string;
  /** Keys of the command's own shortcut, shown at the end of the row (["⌘", "J"]). */
  shortcut?: ReadonlyArray<string>;
  /** More words the query matches besides the label (a path, synonyms). */
  keywords?: ReadonlyArray<string>;
  disabled?: boolean;
};

export type SearchProps = {
  /** Commands in order. Strings are accepted as value = label. */
  items: ReadonlyArray<SearchItem | string>;
  /** Controlled query. Omit for uncontrolled (use defaultQuery). */
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  onSelect?: (value: string, item: SearchItem) => void;
  /** Rows shown while the query is empty. */
  limit?: number;
  placeholder?: string;
  /** Accessible name of the field. */
  label?: string;
  clearLabel?: string;
  emptyTitle?: string;
  emptyHint?: string;
  /** The first row starts highlighted, so Enter runs it at once (a command palette). */
  highlightFirst?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/** Inline command search. Behaviour by Ark UI (Zag combobox, kept open). */
export function Search({
  items, query, defaultQuery = "", onQueryChange, onSelect, limit = 5, placeholder = "Search…", label = "Search",
  clearLabel = "Clear search", emptyTitle = "No results found", emptyHint = "Adjust your search to try again", highlightFirst = false, className, style, ...data
}: SearchProps) {
  const all = useMemo(() => items.map((item): SearchItem => (typeof item === "string" ? { value: item, label: item } : item)), [items]);
  const [inner, setInner] = useState(defaultQuery);
  const [value, setValue] = useState<string[]>([]);
  const q = query ?? inner;
  const setQuery = (next: string) => { if (query === undefined) setInner(next); onQueryChange?.(next); };

  /* only matching rows are rendered; the first `limit` while the query is empty */
  /* rows of a group stay together, so the collection (the arrow keys' order) is the drawn order */
  const runs = useMemo(() => groupRows(filterRows(all, q, limit)), [all, q, limit]);
  const shown = useMemo(() => runs.flatMap((run) => run.items), [runs]);
  const collection = useMemo(() => createListCollection<SearchItem>({ items: shown }), [shown]);
  const isEmpty = shown.length === 0 && q.trim() !== "";

  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const highlight = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    trackModality();
    if (!list.current || !highlight.current) return;
    return glide(list.current, highlight.current, { rows: "[data-slot=search-item]", follow: "highlighted" });
  }, []);

  /* arms the clear button's fade-in once mounted: a mount is not an arrival */
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const r = search({ ready });

  const row = (item: SearchItem) => (
    <Combobox.Item key={item.value} item={item} data-slot="search-item" className={r.item()}>
      {item.icon && <span data-slot="search-item-icon" className={r.itemIcon()} aria-hidden>{item.icon}</span>}
      <Combobox.ItemText data-slot="search-item-text" className={r.itemText()}>{item.label}</Combobox.ItemText>
      {item.meta && <span data-slot="search-item-meta" className={r.itemMeta()}>{item.meta}</span>}
      {item.shortcut && <Kbd data-search="item-shortcut" className={r.itemShortcut()} keys={[...item.shortcut]} />}
    </Combobox.Item>
  );

  /* Escape and the clear button empty the field (and the selection); focus never leaves the field */
  const reset = () => { setValue([]); setQuery(""); };

  return (
    <Combobox.Root
      {...data} data-slot="search"
      className={r.base({ class: className })}
      style={style}
      collection={collection}
      inputValue={q}
      onInputValueChange={(details) => setQuery(details.inputValue)}
      value={value}
      onValueChange={(details) => setValue(details.value)}
      onSelect={(details) => {
        const item = all.find((entry) => entry.value === details.itemValue);
        if (item) onSelect?.(item.value, item);
      }}
      placeholder={placeholder}
      defaultHighlightedValue={highlightFirst ? shown[0]?.value : undefined}
      /* inline list: always open, nothing to dismiss, nothing to position */
      open
      disableLayer
      closeOnSelect={false}
      openOnClick={false}
      /* free text is a valid query; the first match is highlighted while typing so Enter takes it */
      allowCustomValue
      inputBehavior="autohighlight"
      selectionBehavior="replace"
    >
      <div data-slot="search-panel" className={r.panel()}>
        <Combobox.Control data-slot="search-bar" className={r.bar()}>
          <MagnifyingGlass data-slot="search-icon" className={r.icon()} weight="bold" aria-hidden />
          <Combobox.Input
            ref={input}
            data-slot="search-input"
            className={r.input()}
            aria-label={label}
            onKeyDown={(event) => { if (event.key === "Escape" && q !== "") reset(); }}
          />
          <Tooltip content={clearLabel}>
            <Button
              data-search="clear"
              className={r.clear()}
              variant="ghost"
              size="xs"
              square
              muted
              icon={<X data-slot="icon" weight="bold" />}
              tabIndex={-1}
              aria-label={clearLabel}
              hidden={q === ""}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => { reset(); input.current?.focus(); }}
            />
          </Tooltip>
        </Combobox.Control>
        <Combobox.Content ref={list} data-slot="search-list" className={r.list()} hidden={isEmpty}>
          <span ref={highlight} data-slot="search-highlight" className={r.highlight()} aria-hidden />
          {runs.map((run) => (run.group === undefined ? run.items.map(row) : (
            <Combobox.ItemGroup key={`group:${run.group}`} data-slot="search-group" className={r.group()}>
              <Combobox.ItemGroupLabel data-slot="search-group-label" className={r.groupLabel()}>{run.group}</Combobox.ItemGroupLabel>
              {run.items.map(row)}
            </Combobox.ItemGroup>
          )))}
        </Combobox.Content>
        <EmptyState data-search="empty" className={r.empty()} size="block" align="center" icon="magnifying-glass" title={emptyTitle} hint={emptyHint} hidden={!isEmpty} />
      </div>
    </Combobox.Root>
  );
}
