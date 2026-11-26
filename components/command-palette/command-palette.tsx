"use client";
import { useEffect, useMemo, useState } from "react";
import { isHotkey, paletteRows } from "../search/search.logic";
import { commandPalette } from "./command-palette.recipe";
import { Dialog } from "../dialog/dialog";
import { Search, type SearchItem } from "../search/search";

export type CommandPaletteItem = SearchItem;

export type CommandPaletteProps = {
  /** Every command and page, in order; `group` lists them under a label ("Pages", "Actions"). */
  items: ReadonlyArray<CommandPaletteItem>;
  /** Values of recently used commands, most recent first: listed first, under `recentLabel`, while the query is empty. */
  recent?: ReadonlyArray<string>;
  recentLabel?: string;
  /** Controlled open state. Omit for uncontrolled (use defaultOpen). */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** A command was chosen (Enter or a click). The palette has already closed. */
  onSelect?: (value: string, item: CommandPaletteItem) => void;
  /** The query it opens with (a field that opens the palette on a printable key passes that key). */
  defaultQuery?: string;
  /** ⌘K / Ctrl K anywhere on the page opens and closes it with this key. false: no global shortcut (bind your own). */
  hotkey?: string | false;
  /** Rows shown while the query is empty, after the recent ones. */
  limit?: number;
  /** Names the dialog for assistive technology. */
  title?: string;
  /** Accessible name of the field. */
  label?: string;
  placeholder?: string;
  emptyTitle?: string;
  emptyHint?: string;
  className?: string;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/** ⌘K command palette: the Search in a bare Dialog. */
export function CommandPalette({
  items, recent = [], recentLabel = "Recent", open, defaultOpen = false, onOpenChange, onSelect, defaultQuery = "", hotkey = "k", limit = 8,
  title = "Command palette", label = "Search commands", placeholder = "Type a command or search…", emptyTitle = "No results found",
  emptyHint = "Try another word, or a page name.", className, ...data
}: CommandPaletteProps) {
  const [inner, setInner] = useState(defaultOpen);
  const isOpen = open ?? inner;
  const setOpen = (next: boolean) => { if (open === undefined) setInner(next); onOpenChange?.(next); };
  const [query, setQuery] = useState(defaultQuery);
  /* every opening starts from the query it is given */
  useEffect(() => { if (isOpen) setQuery(defaultQuery); }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hotkey === false) return;
    const onKey = (event: KeyboardEvent) => {
      if (!isHotkey(event, hotkey)) return;
      event.preventDefault();
      setQuery("");
      setOpen(!isOpen);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  /* Escape clears a query before it closes the palette: taken on the window, before the dialog's
   * own listener on the document sees it */
  useEffect(() => {
    if (!isOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.isComposing || !query) return;
      event.stopPropagation();
      event.preventDefault();
      setQuery("");
    };
    window.addEventListener("keydown", onEscape, true);
    return () => window.removeEventListener("keydown", onEscape, true);
  }, [isOpen, query]);

  const rows = useMemo(() => paletteRows(items, recent, recentLabel, query), [items, recent, recentLabel, query]);
  const r = commandPalette();
  return (
    <div {...data} data-slot="command-palette" className={r.base({ class: className })}>
      <Dialog open={isOpen} onOpenChange={setOpen} title={title} bare size="md" placement="top" instant>
        {/* mounted while open: the field takes focus and the highlight starts on the first row */}
        {isOpen && (
          <Search
            data-command-palette="search"
            className={r.search()}
            items={rows}
            query={query}
            onQueryChange={setQuery}
            limit={recent.length + limit}
            highlightFirst
            label={label}
            placeholder={placeholder}
            emptyTitle={emptyTitle}
            emptyHint={emptyHint}
            onSelect={(value, item) => { setOpen(false); onSelect?.(value, items.find((i) => i.value === value) ?? item); }}
          />
        )}
      </Dialog>
    </div>
  );
}
