<!-- ⌘K command palette: the Search in a bare Dialog. -->
<script lang="ts">
  import { isHotkey, paletteRows } from "../search/search.logic";
  import { commandPalette } from "./command-palette.recipe";
  import Dialog from "../dialog/Dialog.svelte";
  import Search, { type SearchItem } from "../search/Search.svelte";

  export type CommandPaletteItem = SearchItem;

  type Props = {
    /** Every command and page, in order; `group` lists them under a label ("Pages", "Actions"). */
    items: ReadonlyArray<CommandPaletteItem>;
    /** Values of recently used commands, most recent first: listed first, under `recentLabel`, while the query is empty. */
    recent?: ReadonlyArray<string>;
    recentLabel?: string;
    /** Two-way bindable: <CommandPalette bind:open /> */
    open?: boolean;
    onopenchange?: (open: boolean) => void;
    /** A command was chosen (Enter or a click). The palette has already closed. */
    onselect?: (value: string, item: CommandPaletteItem) => void;
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
    class?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    items, recent = [], recentLabel = "Recent", open = $bindable(false), onopenchange, onselect, defaultQuery = "", hotkey = "k", limit = 8,
    title = "Command palette", label = "Search commands", placeholder = "Type a command or search…", emptyTitle = "No results found",
    emptyHint = "Try another word, or a page name.", class: className, ...data
  }: Props = $props();

  function setOpen(next: boolean) { open = next; onopenchange?.(next); }
  // svelte-ignore state_referenced_locally
  let query = $state(defaultQuery);
  /* every opening starts from the query it is given */
  let was = false;
  $effect(() => { if (open && !was) query = defaultQuery; was = open; });

  $effect(() => {
    if (hotkey === false) return;
    const key = hotkey;
    const onKey = (event: KeyboardEvent) => {
      if (!isHotkey(event, key)) return;
      event.preventDefault();
      query = "";
      setOpen(!open);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  /* Escape clears a query before it closes the palette: taken on the window, before the dialog's
   * own listener on the document sees it */
  $effect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.isComposing || !query) return;
      event.stopPropagation();
      event.preventDefault();
      query = "";
    };
    window.addEventListener("keydown", onEscape, true);
    return () => window.removeEventListener("keydown", onEscape, true);
  });

  const rows = $derived(paletteRows(items, recent, recentLabel, query));
  const r = commandPalette();
</script>

<div {...data} data-slot="command-palette" class={r.base({ class: className })}>
  <Dialog {open} onopenchange={setOpen} {title} bare size="md" placement="top" instant>
    {#if open}
      <Search
        bind:query
        data-command-palette="search"
        class={r.search()}
        items={rows}
        limit={recent.length + limit}
        highlightFirst
        {label}
        {placeholder}
        {emptyTitle}
        {emptyHint}
        onselect={(value, item) => { setOpen(false); onselect?.(value, items.find((i) => i.value === value) ?? item); }}
      />
    {/if}
  </Dialog>
</div>
