<!-- A records grid: sortable headers, row selection, column and row menus. -->
<script lang="ts">
  import ArrowDown from "phosphor-svelte/lib/ArrowDownIcon";
  import ArrowSquareOut from "phosphor-svelte/lib/ArrowSquareOutIcon";
  import ArrowUp from "phosphor-svelte/lib/ArrowUpIcon";
  import Columns from "phosphor-svelte/lib/ColumnsIcon";
  import DotsThree from "phosphor-svelte/lib/DotsThreeIcon";
  import EyeSlash from "phosphor-svelte/lib/EyeSlashIcon";
  import { Menu as ArkMenu, useMenu } from "@ark-ui/svelte/menu";
  import { Portal } from "@ark-ui/svelte/portal";
  import { mergeProps } from "@ark-ui/svelte/utils";
  import type { Snippet } from "svelte";
  import Button from "../button/Button.svelte";
  import Checkbox from "../checkbox/Checkbox.svelte";
  import Count from "../count/Count.svelte";
  import EmptyState from "../empty-state/EmptyState.svelte";
  import Menu, { type MenuEntry } from "../menu/Menu.svelte";
  import Tag from "../tag/Tag.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { menu as menuRecipe } from "../menu/menu.recipe";
  import { recordsTable } from "./records-table.recipe";
  import { glide } from "../lib/glide";
  import { trackModality } from "../lib/modality";
  import {
    ACTIONS_WIDTH, DEFAULT_LOCALE, MAX_TAGS, ariaSort, columnType, columnWidth, fillLabel, formatNumber, isBlank, isHideable, isSortable, linkHref,
    nextSort, recordsLabels, rowClickOpens, rowKey, rowName, selectAllState, selectedCount, sortRows, statusOption, tableMinWidth, tagTone, textOf, toggleAll, toggleHidden,
    toggleOne, visibleSpan,
    type RecordsTableAction, type RecordsTableColumn, type RecordsTableLabels, type RecordsTableRow, type RecordsTableSort, type RecordsTableValue,
  } from "./records-table.logic";

  export type {
    RecordsTableAction, RecordsTableColumn, RecordsTableLabels, RecordsTableRow, RecordsTableSort, RecordsTableSortDirection,
    RecordsTableStatusOption, RecordsTableTone, RecordsTableValue,
  } from "./records-table.logic";

  type Props = {
    columns: ReadonlyArray<RecordsTableColumn>;
    rows?: ReadonlyArray<RecordsTableRow>;
    /** Two-way bindable: <RecordsTable bind:sort /> */
    sort?: RecordsTableSort;
    /** Two-way bindable: <RecordsTable bind:selected /> (row ids) */
    selected?: ReadonlyArray<string>;
    /** Two-way bindable: <RecordsTable bind:hiddenColumns /> (column keys) */
    hiddenColumns?: ReadonlyArray<string>;
    /** Entries of the menu at the end of every row (one menu shared by all rows). Without them the rows have no menu. */
    rowActions?: ReadonlyArray<RecordsTableAction>;
    /** Locale of the number cells (grouping, decimals). Default en-US. */
    locale?: string;
    labels?: Partial<RecordsTableLabels>;
    onsortchange?: (sort: RecordsTableSort) => void;
    onselectedchange?: (selected: string[]) => void;
    onhiddencolumnschange?: (hidden: string[]) => void;
    onrowaction?: (value: string, rowId: string) => void;
    /** A row was opened: a click on it (not on its checkbox, link or menu) or Enter on the focused row.
     * With it the rows are one tab stop; the arrow keys move between them, Space selects. */
    onrowopen?: (rowId: string) => void;
    /** Bulk actions in the selection bar, after the count (Buttons, a Menu); receives the selected ids. */
    selectionActions?: Snippet<[string[]]>;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    columns, rows = [], sort = $bindable(null), selected = $bindable([]), hiddenColumns = $bindable([]), rowActions, locale = DEFAULT_LOCALE, labels,
    onsortchange, onselectedchange, onhiddencolumnschange, onrowaction, onrowopen, selectionActions, class: className, style, ...data
  }: Props = $props();

  /* class strings are worked out once: a table renders hundreds of cells */
  const r = recordsTable();
  const m = menuRecipe();
  const CELL = [r.cell(), r.cell({ numeric: true }), r.cell({ primary: true }), r.cell({ primary: true, numeric: true })];
  const cellClass = (type: string, primary = false) => CELL[(primary ? 2 : 0) + (type === "number" ? 1 : 0)];
  const ACTION_CELL = r.cell({ actions: true });
  const ROW = [r.row(), r.row({ selected: true })];
  const OPEN_ROW = [r.row({ openable: true }), r.row({ openable: true, selected: true })];
  const ROWNUM = [r.rownum(), r.rownum({ selected: true })];
  /* a header cell's variants: the first column, a number column */
  const thv = (column: RecordsTableColumn, index: number) => ({ primary: index === 0, numeric: columnType(column) === "number" });
  const BODY_CHECK = [recordsTable({ body: true }).check(), recordsTable({ body: true, selected: true }).check()];
  const TRIGGER_CLASS = {
    columns: `${r.menuTrigger()}`,
    column: `${recordsTable({ trigger: "column" }).menuTrigger()}`,
    row: `${recordsTable({ trigger: "row" }).menuTrigger()}`,
  };
  const ROW_MENU_POSITIONER = `${m.positioner()} ${r.rowMenu()}`;
  const copy = $derived(recordsLabels(labels));
  const display = $derived(sortRows(rows, columns, sort));
  const ids = $derived(rows.map((row) => row.id));
  /* opening a row: the rows are one tab stop, the last one focused (the first at the start) */
  let focusId = $state<string | null>(null);
  const tabRow = $derived(onrowopen ? (display.some((row) => row.id === focusId) ? focusId : display[0]?.id ?? null) : null);
  const selectedHere = $derived(selected.filter((id) => ids.includes(id)));
  const on = $derived(new Set(selected));
  const count = $derived(selectedCount(ids, selected));
  const all = $derived(selectAllState(ids, selected));
  const hideable = $derived(columns.filter((column, index) => isHideable(column, index)));
  const columnsMenu = $derived<MenuEntry[]>([
    { type: "group", label: copy.columns, items: hideable.map((column) => ({ type: "checkbox" as const, value: column.key, label: column.label, checked: !hiddenColumns.includes(column.key) })) },
  ]);
  const actions = $derived(rowActions ?? []);
  /* The row menu is one Zag menu with a trigger per row (the trigger's value is the row id). Its
   * machine lives here, not in a Menu.Root around the table (the column menus would nest in it); the
   * rows read their trigger props from an api that changes only when the menu opens, closes or moves
   * to another row, so sorting and selecting never touch the triggers. */
  let activeRow: string | null = null;
  const rowMenu = useMenu(() => ({
    positioning: { placement: "bottom-end", gutter: 4 },
    onSelect: (details: { value: string }) => { if (activeRow !== null) onrowaction?.(details.value, activeRow); },
    onTriggerValueChange: (details: { value: string | null }) => { activeRow = details.value; },
  }));
  let cached: { open: boolean; value: string | null; api: ReturnType<typeof rowMenu>["api"] } | null = null;
  const triggerApi = $derived.by(() => {
    const api = rowMenu().api;
    if (!cached || cached.open !== api.open || cached.value !== api.triggerValue) cached = { open: api.open, value: api.triggerValue, api };
    return cached.api;
  });
  let rowContent = $state<HTMLElement | null>(null);
  let rowHighlight = $state<HTMLElement | null>(null);
  $effect(() => (rowContent && rowHighlight ? glide(rowContent, rowHighlight, { rows: "[data-slot=menu-item]", follow: "highlighted" }) : undefined));

  function setSort(next: RecordsTableSort) {
    sort = next;
    onsortchange?.(next);
  }
  function setSelected(next: string[]) {
    selected = next;
    onselectedchange?.(next);
  }
  function setHidden(next: string[]) {
    hiddenColumns = next;
    onhiddencolumnschange?.(next);
  }

  let root = $state<HTMLElement | null>(null);
  function columnMenu(column: RecordsTableColumn, index: number): MenuEntry[] {
    return [
      ...(isSortable(column) ? [
        { value: "sort-ascending", label: copy.sortAscending, icon: ArrowUp },
        { value: "sort-descending", label: copy.sortDescending, icon: ArrowDown },
      ] : []),
      ...(isSortable(column) && isHideable(column, index) ? [{ type: "separator" as const }] : []),
      ...(isHideable(column, index) ? [{ value: "hide", label: copy.hideColumn, icon: EyeSlash }] : []),
    ];
  }
  function onColumnMenu(column: RecordsTableColumn, value: string) {
    if (value === "sort-ascending" || value === "sort-descending") setSort({ key: column.key, direction: value === "sort-ascending" ? "ascending" : "descending" });
    if (value === "hide") {
      setHidden(toggleHidden(hiddenColumns, column.key, true));
      /* the hidden column took its menu trigger with it: focus moves to the Columns menu, where it can come back */
      setTimeout(() => root?.querySelector<HTMLElement>("[data-records-table=columns-menu] [data-menu=trigger]")?.focus(), 0);
    }
  }
  const tagsOf = (value: RecordsTableValue): ReadonlyArray<string> => (Array.isArray(value) ? value : [textOf(value)]);
  const cellValue = (column: RecordsTableColumn, row: RecordsTableRow) => {
    const value = row[column.key];
    const type = columnType(column);
    return !isBlank(value) && (type === "number" || type === "status") ? textOf(value) : undefined;
  };

  $effect(() => trackModality());
</script>

{#snippet value(column: RecordsTableColumn, row: RecordsTableRow, primary: boolean)}
  {@const v = row[column.key]}
  {@const type = primary ? "text" : columnType(column)}
  {#if isBlank(v)}
    <span data-slot="records-table-blank" class={r.blank()}>—</span>
  {:else if type === "number"}
    <span data-slot="records-table-number" class={r.number()}>{formatNumber(v, locale)}</span>
  {:else if type === "status"}
    {@const option = statusOption(column, v)}
    <span data-slot="records-table-status" class={r.status({ tone: option?.tone ?? "neutral" })}><span data-slot="records-table-dot" class={r.dot()} aria-hidden="true"></span>{option?.label ?? textOf(v)}</span>
  {:else if type === "tags"}
    {@const tags = tagsOf(v)}
    <span data-slot="records-table-tags" class={r.tags()} title={tags.join(", ")}>
      {#each tags.slice(0, MAX_TAGS) as tag, i (i)}<Tag tone={tagTone(tag, column)}>{tag}</Tag>{/each}
      {#if tags.length > MAX_TAGS}<Count variant="boxed">{`+${tags.length - MAX_TAGS}`}</Count>{/if}
    </span>
  {:else if type === "link"}
    <a data-slot="records-table-link" class={r.link()} href={linkHref(textOf(v))} target="_blank" rel="noreferrer" title={textOf(v)}>
      <span data-slot="records-table-link-text" class={r.linkText()}>{textOf(v)}</span><ArrowSquareOut data-slot="icon" weight="bold" aria-hidden="true" />
    </a>
  {:else}
    <span data-slot="records-table-text" class={r.text()} title={textOf(v)}>{textOf(v)}</span>
  {/if}
{/snippet}

<div bind:this={root} {...data} data-slot="records-table" class={r.base({ class: className })} {style}>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex (a scroll region must be focusable to scroll from the keyboard) -->
  <div data-slot="records-table-scroll" class={r.scroll()} role="region" aria-label={copy.region} tabindex="0">
    <table data-slot="records-table-table" class={r.table()} style:min-width="{tableMinWidth(columns, hiddenColumns)}px">
      <thead>
        <tr data-slot="records-table-head-row" class={r.headRow()}>
          {#each columns as column, index (column.key)}
            {@const items = columnMenu(column, index)}
            <th
              data-slot="records-table-th" class={r.th(thv(column, index))}
              scope="col"
              data-col={column.key}
              aria-sort={isSortable(column) ? ariaSort(sort, column.key) : undefined}
              hidden={hiddenColumns.includes(column.key)}
              style:--fndn-col-width="{columnWidth(column, index)}px"
            >
              <div data-slot="records-table-th-inner" class={r.thInner(thv(column, index))}>
                {#if index === 0}
                  <span data-slot="records-table-gutter" class={r.gutter()}>
                    <Checkbox data-records-table="check" class={r.check()} checked={all} disabled={!ids.length} aria-label={copy.selectAll} oncheckedchange={() => setSelected(toggleAll(ids, selected))} />
                  </span>
                {/if}
                {#if isSortable(column)}
                  <button type="button" data-slot="records-table-sort" class={r.sort(thv(column, index))} onclick={() => setSort(nextSort(sort, column.key))}>
                    <span data-slot="records-table-th-label" class={r.thLabel(thv(column, index))}>{column.label}</span>
                    <span data-slot="records-table-sort-icon" class={r.sortIcon()} aria-hidden="true"><ArrowDown data-slot="icon" weight="bold" /></span>
                  </button>
                {:else}
                  <span data-slot="records-table-th-label" class={r.thLabel(thv(column, index))}>{column.label}</span>
                {/if}
                {#if items.length}
                  <Menu data-records-table="col-menu" class={r.colMenu(thv(column, index))} {items} placement="bottom-end" onselect={(v) => onColumnMenu(column, v)}>
                    {#snippet trigger(menuProps)}
                      {@const label = fillLabel(copy.columnMenu, { column: column.label })}
                      <Tooltip content={label} triggerId={menuProps().id ?? undefined}>
                        {#snippet trigger(tipProps)}
                          <Button {...mergeProps(tipProps(), menuProps())} data-menu="trigger" data-records-table="menu-trigger" class={TRIGGER_CLASS.column} variant="ghost" size="xs" shape="rounded" square muted aria-label={label}>
                            {#snippet icon()}<DotsThree data-slot="icon" weight="bold" />{/snippet}
                          </Button>
                        {/snippet}
                      </Tooltip>
                    {/snippet}
                  </Menu>
                {/if}
              </div>
            </th>
          {/each}
          <th data-slot="records-table-th" class={r.th({ actions: true })} scope="col" style:--fndn-col-width="{ACTIONS_WIDTH}px">
            {#if hideable.length}
              <Menu data-records-table="columns-menu" class={r.columnsMenu()} placement="bottom-end" items={columnsMenu} oncheckedchange={(key, checked) => setHidden(toggleHidden(hiddenColumns, key, !checked))}>
                {#snippet trigger(menuProps)}
                  <Tooltip content={copy.columns} triggerId={menuProps().id ?? undefined}>
                    {#snippet trigger(tipProps)}
                      <Button {...mergeProps(tipProps(), menuProps())} data-menu="trigger" data-records-table="menu-trigger" class={TRIGGER_CLASS.columns} variant="ghost" size="xs" shape="rounded" square muted aria-label={copy.columns}>
                        {#snippet icon()}<Columns data-slot="icon" weight="bold" />{/snippet}
                      </Button>
                    {/snippet}
                  </Tooltip>
                {/snippet}
              </Menu>
            {/if}
          </th>
        </tr>
      </thead>
      <tbody>
        {#each display as row (row.id)}
          {@const name = rowName(row, columns)}
          <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (a row that opens: one tab stop, its keys in records-table.logic.ts) -->
          <tr
            data-slot="records-table-row" class={(onrowopen ? OPEN_ROW : ROW)[on.has(row.id) ? 1 : 0]} data-id={row.id}
            tabindex={onrowopen ? (tabRow === row.id ? 0 : -1) : undefined}
            onclick={onrowopen ? (event) => { if (rowClickOpens(event)) onrowopen(row.id); } : undefined}
            onkeydown={onrowopen ? (event) => { if (rowKey(event) === "open") onrowopen(row.id); } : undefined}
            onfocus={onrowopen ? (event) => { if (event.target === event.currentTarget) focusId = row.id; } : undefined}
          >
            {#each columns as column, index (column.key)}
              <td
                data-slot="records-table-cell" class={cellClass(columnType(column), index === 0)}
                data-col={column.key}
                data-value={cellValue(column, row)}
                hidden={hiddenColumns.includes(column.key)}
              >
                {#if index === 0}
                  <div data-slot="records-table-primary" class={r.primary()}>
                    <span data-slot="records-table-gutter" class={r.gutter()}>
                      <span data-slot="records-table-rownum" class={ROWNUM[on.has(row.id) ? 1 : 0]} aria-hidden="true"></span>
                      <Checkbox data-records-table="check" class={BODY_CHECK[on.has(row.id) ? 1 : 0]} checked={on.has(row.id)} aria-label={fillLabel(copy.selectRow, { row: name })} oncheckedchange={(checked) => setSelected(toggleOne(selected, row.id, checked === true))} />
                    </span>
                    {@render value(column, row, true)}
                  </div>
                {:else}
                  {@render value(column, row, false)}
                {/if}
              </td>
            {/each}
            <td data-slot="records-table-cell" class={ACTION_CELL}>
              {#if actions.length}
                {@const label = fillLabel(copy.rowActions, { row: name })}
                {@const menuProps = triggerApi.getTriggerProps({ value: row.id })}
                <Tooltip content={label} triggerId={menuProps.id ?? undefined}>
                  {#snippet trigger(tipProps)}
                    <Button {...mergeProps(tipProps(), menuProps)} data-menu="trigger" data-records-table="menu-trigger" class={TRIGGER_CLASS.row} variant="ghost" size="xs" shape="rounded" square muted aria-label={label}>
                      {#snippet icon()}<DotsThree data-slot="icon" weight="bold" />{/snippet}
                    </Button>
                  {/snippet}
                </Tooltip>
              {/if}
            </td>
          </tr>
        {:else}
          <tr data-slot="records-table-empty-row" class={r.emptyRow()}>
            <td data-slot="records-table-empty" class={r.empty()} colspan={visibleSpan(columns, hiddenColumns)}><EmptyState title={copy.empty} icon="table" size="block" /></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <div data-slot="records-table-selection" class={r.selection({ open: count > 0 })} inert={count === 0}>
    <div data-slot="records-table-selection-inner" class={r.selectionInner()}>
      <span data-slot="records-table-selection-count" class={r.selectionCount()} role="status">{fillLabel(copy.selected, { count })}</span>
      {#if selectionActions}<div data-slot="records-table-selection-actions" class={r.selectionActions()}>{@render selectionActions(selectedHere)}</div>{/if}
      <Button data-records-table="selection-clear" class={r.selectionClear()} variant="ghost" size="sm" onclick={() => setSelected(selected.filter((id) => !ids.includes(id)))}>
        {copy.clearSelection}
      </Button>
    </div>
  </div>
</div>
{#if actions.length}
  <ArkMenu.RootProvider value={rowMenu}>
  <Portal>
    <ArkMenu.Positioner data-slot="menu-positioner" data-records-table="row-menu" class={ROW_MENU_POSITIONER}>
      <ArkMenu.Content bind:ref={rowContent} data-slot="menu-content" class={m.content()}>
        <span bind:this={rowHighlight} data-slot="menu-highlight" class={m.highlight()} aria-hidden="true"></span>
        {#each actions as item, index (item.type === "separator" ? `separator-${index}` : item.value)}
          {#if item.type === "separator"}
            <ArkMenu.Separator data-slot="menu-separator" class={m.separator()} />
          {:else}
            <ArkMenu.Item value={item.value} disabled={item.disabled} data-slot="menu-item" class={m.item({ tone: item.tone })}>
              <span data-slot="menu-item-text" class={m.itemText()}>{item.label}</span>
            </ArkMenu.Item>
          {/if}
        {/each}
      </ArkMenu.Content>
    </ArkMenu.Positioner>
  </Portal>
  </ArkMenu.RootProvider>
{/if}
