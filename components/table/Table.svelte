<!-- A plain data table in the records table's look.
     The root is the scrolling card; every other attribute (aria-label …) goes to the <table>.
     Row is the type of one row of the data form, so the cell snippet receives it typed. -->
<script lang="ts" module>
  export type TableColumn = {
    key: string;
    label: string;
    /** A number column: aligned to the end, tabular figures. */
    numeric?: boolean;
    /** The column that gives way (a title): it takes the room left and cuts its text, with a title. */
    truncate?: boolean;
  };
</script>

<script lang="ts" generics="Row extends Record<string, unknown> = Record<string, unknown>">
  import type { Snippet } from "svelte";
  import type { HTMLTableAttributes } from "svelte/elements";
  import { table } from "./table.recipe";
  import { watchVeils } from "../lib/veil";
  import { truncationTitles } from "../lib/truncate";
  import TableBody from "./TableBody.svelte";
  import TableCaption from "./TableCaption.svelte";
  import TableCell from "./TableCell.svelte";
  import TableHead from "./TableHead.svelte";
  import TableHeader from "./TableHeader.svelte";
  import TableRow from "./TableRow.svelte";
  import TableSkeleton from "./TableSkeleton.svelte";

  type Props = Omit<HTMLTableAttributes, "children"> & {
    /** Data form: the columns in order. With columns and rows the Table renders its own header and body. */
    columns?: ReadonlyArray<TableColumn>;
    /** Data form: one object per row, values by column key. A value is shown as text unless the
     * cell snippet renders it; a row may carry more fields for that snippet (a tone, an avatar). */
    rows?: ReadonlyArray<Row>;
    /** Data form: the caption under the rows. With parts, use <TableCaption>. */
    caption?: string;
    /** card: the records table's surface card with rules between rows and columns. flush: no card,
     * a hairline between rows only, single-line rows (an issue list, a file list). */
    variant?: "card" | "flush";
    /** The data is on its way: aria-busy, and in the data form placeholder rows in place of the rows. */
    loading?: boolean;
    /** How many placeholder rows while loading (default 5). */
    loadingRows?: number;
    /** The parts (TableHeader, TableBody, TableCaption …), when columns and rows are not given. */
    children?: Snippet;
    /** Data form: the content of one value cell (a status pill, an avatar, a link), inside the cell;
     * without it the value is shown as text. Render `value` for the columns you leave as they are. */
    cell?: Snippet<[{ row: Row; column: TableColumn; value: unknown; rowIndex: number; columnIndex: number }]>;
  };

  let { columns, rows, caption, variant = "card", loading = false, loadingRows = 5, class: className, style, children, cell, ...rest }: Props = $props();
  const r = $derived(table({ variant }));
  /* the edge veils are armed while the table overflows its card (measured); a cut cell carries its full text as a title */
  let card: HTMLDivElement | undefined = $state();
  $effect(() => watchVeils(card ?? null));
  $effect(() => truncationTitles(card ?? null, "[data-slot=table-cell]"));
</script>

<div bind:this={card} data-slot="table" class={r.base({ class: className as string | undefined })} {style}>
  <table data-slot="table-table" class={r.table()} aria-busy={loading || undefined} {...rest}>
    {#if columns}
      {#if caption}<TableCaption>{caption}</TableCaption>{/if}
      <TableHeader>
        <TableRow>
          {#each columns as c (c.key)}<TableHead numeric={c.numeric} truncate={c.truncate}>{c.label}</TableHead>{/each}
        </TableRow>
      </TableHeader>
      <TableBody>
        {#if loading}
          {#each Array.from({ length: loadingRows }, (_, i) => i) as i (i)}
            <TableRow>
              {#each columns as c (c.key)}<TableCell numeric={c.numeric} truncate={c.truncate}><TableSkeleton numeric={c.numeric} /></TableCell>{/each}
            </TableRow>
          {/each}
        {:else}
          {#each rows ?? [] as row, i (i)}
            <TableRow>
              {#each columns as c, j (c.key)}<TableCell numeric={c.numeric} truncate={c.truncate}>{#if cell}{@render cell({ row, column: c, value: row[c.key], rowIndex: i, columnIndex: j })}{:else}{row[c.key]}{/if}</TableCell>{/each}
            </TableRow>
          {/each}
        {/if}
      </TableBody>
    {:else}
      {@render children?.()}
    {/if}
  </table>
</div>
