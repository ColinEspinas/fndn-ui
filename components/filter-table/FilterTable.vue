<script setup lang="ts">
/** Chips (a segmented-control, variant chips) that directly filter a table. */
import { computed, onBeforeUnmount, onMounted, ref, useAttrs } from "vue";
import { filterChips, filterColumns, filterCount, filterGrid, filterLabels, filterMatches, filterPill, filterTag, filterText } from "./filter-table.logic";
import { watchVeils } from "../lib/veil";
import EmptyState from "../empty-state/EmptyState.vue";
import SegmentedControl from "../segmented-control/SegmentedControl.vue";
import StatusPill from "../status-pill/StatusPill.vue";
import Tag from "../tag/Tag.vue";
import { filterTable } from "./filter-table.recipe";
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

const props = withDefaults(
  defineProps<{
    /** The columns in order ({ key, label, type?, width? }). Default: the task table (task, date, status, owner). */
    columns?: ReadonlyArray<FilterTableColumn>;
    /** One object per row, values by column key. */
    rows?: ReadonlyArray<FilterTableRow>;
    /** The chips ({ key, label, tone?, count? }; "all" matches every row). Default: All / To do / In Progress / Completed. */
    filters?: ReadonlyArray<FilterTableFilter>;
    /** The row field the chips match (default "status"). */
    filterKey?: string;
    labels?: FilterTableLabelsInput;
  }>(),
  { columns: undefined, rows: () => [], filters: undefined, filterKey: "status", labels: undefined },
);
/** v-model:filter — falls back to local state when unbound. */
const filter = defineModel<FilterTableFilterKey>("filter", { default: "all" });
const emit = defineEmits<{ change: [filter: FilterTableFilterKey] }>();

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const s = filterTable();
/* the edge veils follow the scroll position, measured before the first paint (lib/veil.ts) */
const card = ref<HTMLElement | null>(null);
let stopVeils = () => {};
onMounted(() => { stopVeils = watchVeils(card.value); });
onBeforeUnmount(() => stopVeils());

const copy = computed(() => filterLabels(props.labels));
const cols = computed(() => filterColumns(props.columns, copy.value));
const chips = computed(() => filterChips(props.filters, copy.value));
const grid = computed(() => filterGrid(cols.value));
const matches = (row: FilterTableRow) => filterMatches(row, filter.value, props.filterKey);
const shown = computed(() => props.rows.filter(matches).length);
const options = computed(() => chips.value.map((f) => ({ value: f.key, label: f.label, dot: f.key === "all" ? undefined : f.tone, count: filterCount(props.rows, f, props.filterKey) })));

function onValue(next: string) {
  filter.value = next;
  emit("change", next);
}
</script>

<template>
  <div v-bind="attrs" data-slot="filter-table" :class="s.base({ class: attrs.class as string | undefined })">
    <SegmentedControl data-filter-table="filters" :class="s.filters()" variant="chips" :aria-label="copy.filters" :options="options" :value="filter" @value-change="onValue" />
    <div ref="card" data-slot="filter-table-card" :class="s.card()" role="region" :aria-label="copy.region" tabindex="0">
      <div data-slot="filter-table-table" :class="s.table()" role="table" :style="grid">
        <div data-slot="filter-table-head" :class="s.head()" role="row">
          <span v-for="c in cols" :key="c.key" data-slot="filter-table-th" :class="s.th({ type: c.type ?? 'text' })" role="columnheader">{{ c.label }}</span>
        </div>
        <div v-for="(row, i) in rows" :key="i" data-slot="filter-table-row" :class="s.row({ shown: matches(row) })">
          <div>
            <div data-slot="filter-table-cells" :class="s.cells()" role="row">
              <span v-for="c in cols" :key="c.key" data-slot="filter-table-cell" :class="s.cell({ type: c.type ?? 'text' })" role="cell">
                <StatusPill v-if="c.type === 'status'" data-filter-table="status" :class="s.status()" size="sm" :tone="filterPill(row[c.key], chips).tone" :dot-tone="filterPill(row[c.key], chips).dotTone">{{ filterPill(row[c.key], chips).label }}</StatusPill>
                <Tag v-else-if="c.type === 'tag'" data-filter-table="tag" :class="s.tag()" :tone="filterTag(row[c.key], chips).tone">{{ filterTag(row[c.key], chips).label }}</Tag>
                <span v-else-if="(c.type ?? 'text') === 'title' || (c.type ?? 'text') === 'text'" :title="filterText(row[c.key])">{{ filterText(row[c.key]) }}</span>
                <template v-else>{{ filterText(row[c.key]) }}</template>
              </span>
            </div>
          </div>
        </div>
      </div>
      <EmptyState v-if="rows.length === 0" data-filter-table="empty" :class="s.empty({ empty: 'block' })" :title="copy.none" icon="table" size="block" />
      <EmptyState v-else data-filter-table="empty" :class="s.empty({ empty: 'row' })" :title="copy.empty" align="center" :hidden="shown !== 0" />
    </div>
  </div>
</template>
