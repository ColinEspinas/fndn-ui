<!-- Chips (a segmented-control, variant chips) that directly filter a table. -->
<script lang="ts">
  import EmptyState from "../empty-state/EmptyState.svelte";
  import SegmentedControl from "../segmented-control/SegmentedControl.svelte";
  import StatusPill from "../status-pill/StatusPill.svelte";
  import Tag from "../tag/Tag.svelte";
  import { filterTable } from "./filter-table.recipe";
  import { filterChips, filterColumns, filterCount, filterGrid, filterLabels, filterMatches, filterPill, filterTag, filterText } from "./filter-table.logic";
  import { watchVeils } from "../lib/veil";
  import type * as FT from "./filter-table.logic";
  export type FilterTableColumn = FT.FilterTableColumn;
  export type FilterTableColumnType = FT.FilterTableColumnType;
  export type FilterTableFilter = FT.FilterTableFilter;
  export type FilterTableLabels = FT.FilterTableLabels;
  export type FilterTableLabelsInput = FT.FilterTableLabelsInput;
  export type FilterTableRow = FT.FilterTableRow;
  export type FilterTableTone = FT.FilterTableTone;
  /** The built-in task table's statuses. */
  export type FilterTableStatus = "todo" | "progress" | "done";
  /** A chip's key: "all", or a value of the filtered field. */
  export type FilterTableFilterKey = string;

  type Props = {
    /** The columns in order ({ key, label, type?, width? }). Default: the task table (task, date, status, owner). */
    columns?: ReadonlyArray<FilterTableColumn>;
    /** One object per row, values by column key. */
    rows?: ReadonlyArray<FilterTableRow>;
    /** The chips ({ key, label, tone?, count? }; "all" matches every row). Default: All / To do / In Progress / Completed. */
    filters?: ReadonlyArray<FilterTableFilter>;
    /** The row field the chips match (default "status"). */
    filterKey?: string;
    /** Two-way bindable: <FilterTable bind:filter /> */
    filter?: FilterTableFilterKey;
    onchange?: (filter: FilterTableFilterKey) => void;
    labels?: FilterTableLabelsInput;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let { columns, rows = [], filters, filterKey = "status", filter = $bindable("all"), onchange, labels, class: className, style, ...data }: Props = $props();
  const s = filterTable();
  /* the edge veils follow the scroll position, measured before the first paint (lib/veil.ts) */
  let card = $state<HTMLElement | null>(null);
  $effect(() => watchVeils(card));

  const copy = $derived(filterLabels(labels));
  const cols = $derived(filterColumns(columns, copy));
  const chips = $derived(filterChips(filters, copy));
  const grid = $derived(Object.entries(filterGrid(cols)).map(([k, v]) => `${k}: ${v}`).join("; "));
  const shown = $derived(rows.filter((r) => filterMatches(r, filter, filterKey)).length);
  const options = $derived(chips.map((f) => ({ value: f.key, label: f.label, dot: f.key === "all" ? undefined : f.tone, count: filterCount(rows, f, filterKey) })));
</script>

<div {...data} data-slot="filter-table" class={s.base({ class: className as string | undefined })} {style}>
  <SegmentedControl
    data-filter-table="filters"
    class={s.filters()}
    variant="chips"
    aria-label={copy.filters}
    {options}
    value={filter}
    onvaluechange={(value) => { filter = value; onchange?.(filter); }}
  />
  <!-- svelte-ignore a11y_no_noninteractive_tabindex (a scroll region must be focusable to scroll from the keyboard) -->
  <div bind:this={card} data-slot="filter-table-card" class={s.card()} role="region" aria-label={copy.region} tabindex="0">
    <div data-slot="filter-table-table" class={s.table()} role="table" style={grid}>
      <div data-slot="filter-table-head" class={s.head()} role="row">
        {#each cols as c (c.key)}<span data-slot="filter-table-th" class={s.th({ type: c.type ?? "text" })} role="columnheader">{c.label}</span>{/each}
      </div>
      {#each rows as row, i (i)}
        <div data-slot="filter-table-row" class={s.row({ shown: filterMatches(row, filter, filterKey) })}>
          <div>
            <div data-slot="filter-table-cells" class={s.cells()} role="row">
              {#each cols as c (c.key)}
                {@const type = c.type ?? "text"}
                <span data-slot="filter-table-cell" class={s.cell({ type })} role="cell">{#if type === "status"}{@const pill = filterPill(row[c.key], chips)}<StatusPill data-filter-table="status" class={s.status()} size="sm" tone={pill.tone} dotTone={pill.dotTone}>{pill.label}</StatusPill>{:else if type === "tag"}{@const tag = filterTag(row[c.key], chips)}<Tag data-filter-table="tag" class={s.tag()} tone={tag.tone}>{tag.label}</Tag>{:else if type === "title" || type === "text"}<span title={filterText(row[c.key])}>{filterText(row[c.key])}</span>{:else}{filterText(row[c.key])}{/if}</span>
              {/each}
            </div>
          </div>
        </div>
      {/each}
    </div>
    {#if rows.length === 0}
      <EmptyState data-filter-table="empty" class={s.empty({ empty: "block" })} title={copy.none} icon="table" size="block" />
    {:else}
      <EmptyState data-filter-table="empty" class={s.empty({ empty: "row" })} title={copy.empty} align="center" hidden={shown !== 0} />
    {/if}
  </div>
</div>
