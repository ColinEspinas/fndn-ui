<!-- Inline command search. Behaviour by Ark UI (Zag combobox, kept open). -->
<script lang="ts">
  import { Combobox, createListCollection } from "@ark-ui/svelte/combobox";
  import MagnifyingGlass from "phosphor-svelte/lib/MagnifyingGlassIcon";
  import X from "phosphor-svelte/lib/XIcon";
  import { glide } from "../lib/glide";
  import { filterRows, groupRows } from "./search.logic";
  import type { Component } from "svelte";
  import { mergeProps } from "@ark-ui/svelte/utils";
  import { trackModality } from "../lib/modality";
  import EmptyState from "../empty-state/EmptyState.svelte";
  import Kbd from "../kbd/Kbd.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import Button from "../button/Button.svelte";
  import { search } from "./search.recipe";

  export type SearchItem = {
    value: string; label: string;
    /** Rows of one group are listed together under this label, groups in the order they first appear. */
    group?: string;
    /** Leading icon: a Phosphor component (GitBranchIcon). */
    icon?: Component<any>;
    /** Trailing muted note (a path, a category). */
    meta?: string;
    /** Keys of the command's own shortcut, shown at the end of the row (["⌘", "J"]). */
    shortcut?: ReadonlyArray<string>;
    /** More words the query matches besides the label (a path, synonyms). */
    keywords?: ReadonlyArray<string>;
    disabled?: boolean;
  };

  type Props = {
    /** Commands in order. Strings are accepted as value = label. */
    items: ReadonlyArray<SearchItem | string>;
    /** Two-way bindable: <Search bind:query /> */
    query?: string;
    onquerychange?: (query: string) => void;
    onselect?: (value: string, item: SearchItem) => void;
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
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    items, query = $bindable(""), onquerychange, onselect, limit = 5, placeholder = "Search…", label = "Search",
    clearLabel = "Clear search", emptyTitle = "No results found", emptyHint = "Adjust your search to try again", highlightFirst = false, class: className, style, ...data
  }: Props = $props();

  const all = $derived(items.map((item): SearchItem => (typeof item === "string" ? { value: item, label: item } : item)));
  /* only matching rows are rendered; the first `limit` while the query is empty */
  /* rows of a group stay together, so the collection (the arrow keys' order) is the drawn order */
  const runs = $derived(groupRows(filterRows(all, query, limit)));
  const shown = $derived(runs.flatMap((run) => run.items));
  const collection = $derived(createListCollection<SearchItem>({ items: shown }));
  const isEmpty = $derived(shown.length === 0 && query.trim() !== "");
  let value = $state<string[]>([]);
  /* arms the clear button's fade-in once mounted: a mount is not an arrival */
  let ready = $state(false);
  $effect(() => { ready = true; });
  const r = $derived(search({ ready }));

  function setQuery(next: string) {
    query = next;
    onquerychange?.(next);
  }
  /* Escape and the clear button empty the field (and the selection); focus never leaves the field */
  function reset() {
    value = [];
    setQuery("");
  }

  let input = $state<HTMLInputElement | null>(null);
  let list = $state<HTMLElement | null>(null);
  let highlight = $state<HTMLElement | null>(null);
  $effect(() => {
    trackModality();
    if (!list || !highlight) return;
    return glide(list, highlight, { rows: "[data-slot=search-item]", follow: "highlighted" });
  });
</script>

<!-- inline list: always open, nothing to dismiss, nothing to position; free text is a valid query
     and the first match is highlighted while typing so Enter takes it -->
{#snippet clearIcon()}<X data-slot="icon" weight="bold" />{/snippet}
{#snippet row(item: SearchItem)}
  <Combobox.Item {item} data-slot="search-item" class={r.item()}
    >{#if item.icon}{@const Icon = item.icon}<span data-slot="search-item-icon" class={r.itemIcon()} aria-hidden="true"><Icon data-slot="icon" weight="bold" /></span>{/if}<Combobox.ItemText data-slot="search-item-text" class={r.itemText()}>{item.label}</Combobox.ItemText
    >{#if item.meta}<span data-slot="search-item-meta" class={r.itemMeta()}>{item.meta}</span>{/if}{#if item.shortcut}<Kbd data-search="item-shortcut" class={r.itemShortcut()} keys={[...item.shortcut]} />{/if}</Combobox.Item
  >
{/snippet}
<Combobox.Root
  {...data} data-slot="search"
  class={r.base({ class: className })}
  {style}
  {collection}
  inputValue={query}
  onInputValueChange={(details) => setQuery(details.inputValue)}
  {value}
  onValueChange={(details) => (value = details.value)}
  onSelect={(details) => {
    const item = all.find((entry) => entry.value === details.itemValue);
    if (item) onselect?.(item.value, item);
  }}
  {placeholder}
  defaultHighlightedValue={highlightFirst ? shown[0]?.value : undefined}
  open
  disableLayer
  closeOnSelect={false}
  openOnClick={false}
  allowCustomValue
  inputBehavior="autohighlight"
  selectionBehavior="replace"
>
  <div data-slot="search-panel" class={r.panel()}>
    <Combobox.Control data-slot="search-bar" class={r.bar()}>
      <MagnifyingGlass data-slot="search-icon" class={r.icon()} weight="bold" aria-hidden="true" />
      <Combobox.Input bind:ref={input} data-slot="search-input" class={r.input()} aria-label={label} onkeydown={(event: KeyboardEvent) => { if (event.key === "Escape" && query !== "") reset(); }} />
      <Tooltip content={clearLabel}>
        {#snippet trigger(props)}
          <Button
            {...mergeProps(props(), {
              onpointerdown: (event: PointerEvent) => event.preventDefault(),
              onclick: () => { reset(); input?.focus(); },
            })}
            data-search="clear"
            class={r.clear()}
            variant="ghost"
            size="xs"
            square
            muted
            icon={clearIcon}
            tabindex={-1}
            aria-label={clearLabel}
            hidden={query === ""}
          />
        {/snippet}
      </Tooltip>
    </Combobox.Control>
    <Combobox.Content bind:ref={list} data-slot="search-list" class={r.list()} hidden={isEmpty}>
      <span bind:this={highlight} data-slot="search-highlight" class={r.highlight()} aria-hidden="true"></span>
      {#each runs as run (`group:${run.group ?? ""}`)}
        {#if run.group === undefined}
          {#each run.items as item (item.value)}{@render row(item)}{/each}
        {:else}
          <Combobox.ItemGroup data-slot="search-group" class={r.group()}>
            <Combobox.ItemGroupLabel data-slot="search-group-label" class={r.groupLabel()}>{run.group}</Combobox.ItemGroupLabel>
            {#each run.items as item (item.value)}{@render row(item)}{/each}
          </Combobox.ItemGroup>
        {/if}
      {/each}
    </Combobox.Content>
    <EmptyState data-search="empty" class={r.empty()} size="block" align="center" icon="magnifying-glass" title={emptyTitle} hint={emptyHint} hidden={!isEmpty} />
  </div>
</Combobox.Root>
