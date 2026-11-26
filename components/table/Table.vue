<script setup lang="ts" generic="Row extends Record<string, unknown> = Record<string, unknown>">
/** A plain data table in the records table's look.
 * The root is the scrolling card; every other attribute (aria-label …) goes to the <table>.
 * Row is the type of one row of the data form, so the cell slot hands it back typed. */
import { computed, onBeforeUnmount, onMounted, ref, useAttrs } from "vue";
import { watchVeils } from "../lib/veil";
import { truncationTitles } from "../lib/truncate";
import { table } from "./table.recipe";
import TableBody from "./TableBody.vue";
import TableCaption from "./TableCaption.vue";
import TableCell from "./TableCell.vue";
import TableHead from "./TableHead.vue";
import TableHeader from "./TableHeader.vue";
import TableRow from "./TableRow.vue";
import TableSkeleton from "./TableSkeleton.vue";

export type TableColumn = {
  key: string;
  label: string;
  /** A number column: aligned to the end, tabular figures. */
  numeric?: boolean;
  /** The column that gives way (a title): it takes the room left and cuts its text, with a title. */
  truncate?: boolean;
};

/* the caller's class and style go on the card, everything else on the <table> */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(defineProps<{
  /** Data form: the columns in order. With columns and rows the Table renders its own header and body. */
  columns?: ReadonlyArray<TableColumn>;
  /** Data form: one object per row, values by column key. A value is shown as text unless the
   * cell slot renders it; a row may carry more fields for that slot (a tone, an avatar). */
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
}>(), { variant: "card", loading: false, loadingRows: 5 });
/** default: the parts (TableHeader, TableBody, TableCaption …), when columns and rows are not given.
 * cell: the content of one value cell of the data form (a status pill, an avatar, a link), inside
 * the cell; without it the value is shown as text. Render `value` for the columns you leave as they are. */
defineSlots<{
  default?: () => unknown;
  cell?: (props: { row: Row; column: TableColumn; value: unknown; rowIndex: number; columnIndex: number }) => unknown;
}>();

const tableAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs;
  return rest;
});
const r = computed(() => table({ variant: props.variant }));
/* the edge veils are armed while the table overflows its card (measured); a cut cell carries its full text as a title */
const card = ref<HTMLDivElement | null>(null);
let stopVeils = () => {};
let stopTitles = () => {};
onMounted(() => { stopVeils = watchVeils(card.value); stopTitles = truncationTitles(card.value, "[data-slot=table-cell]"); });
onBeforeUnmount(() => { stopVeils(); stopTitles(); });
</script>

<template>
  <div ref="card" data-slot="table" :class="r.base({ class: attrs.class as string | undefined })" :style="attrs.style as string | undefined">
    <table v-bind="tableAttrs" data-slot="table-table" :class="r.table()" :aria-busy="loading || undefined">
      <template v-if="columns">
        <TableCaption v-if="caption">{{ caption }}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead v-for="c in columns" :key="c.key" :numeric="c.numeric" :truncate="c.truncate">{{ c.label }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="loading">
            <TableRow v-for="i in loadingRows" :key="i">
              <TableCell v-for="c in columns" :key="c.key" :numeric="c.numeric" :truncate="c.truncate"><TableSkeleton :numeric="c.numeric" /></TableCell>
            </TableRow>
          </template>
          <template v-else>
            <TableRow v-for="(row, i) in rows ?? []" :key="i">
              <TableCell v-for="(c, j) in columns" :key="c.key" :numeric="c.numeric" :truncate="c.truncate"><slot name="cell" :row="row" :column="c" :value="row[c.key]" :rowIndex="i" :columnIndex="j">{{ row[c.key] }}</slot></TableCell>
            </TableRow>
          </template>
        </TableBody>
      </template>
      <slot v-else />
    </table>
  </div>
</template>
