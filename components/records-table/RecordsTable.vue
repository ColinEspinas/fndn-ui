<script setup lang="ts">
defineOptions({ inheritAttrs: false });
/** A records grid: sortable headers, row selection, column and row menus. */
import { Menu as ArkMenu, useMenu } from "@ark-ui/vue/menu";
import { PhArrowDown, PhArrowSquareOut, PhArrowUp, PhColumns, PhDotsThree, PhEyeSlash } from "@phosphor-icons/vue";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs } from "vue";
import Button from "../button/Button.vue";
import Checkbox from "../checkbox/Checkbox.vue";
import Count from "../count/Count.vue";
import EmptyState from "../empty-state/EmptyState.vue";
import Menu from "../menu/Menu.vue";
import type { MenuEntry } from "../menu/Menu.vue";
import Tag from "../tag/Tag.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import { menu as menuRecipe } from "../menu/menu.recipe";
import { recordsTable } from "./records-table.recipe";
import { glide } from "../lib/glide";
import { trackModality } from "../lib/modality";
import {
  ACTIONS_WIDTH, DEFAULT_LOCALE, MAX_TAGS, ariaSort, columnType, columnWidth, fillLabel, formatNumber, isBlank, isHideable, isSortable, linkHref,
  nextSort, recordsLabels, rowClickOpens, rowKey, rowName, selectAllState, selectedCount, sortRows, statusOption, tableMinWidth, tagTone, textOf, toggleAll, toggleHidden,
  toggleOne, visibleSpan,
  type RecordsTableAction, type RecordsTableColumn, type RecordsTableLabels, type RecordsTableRow, type RecordsTableSort,
} from "./records-table.logic";

export type {
  RecordsTableAction, RecordsTableColumn, RecordsTableLabels, RecordsTableRow, RecordsTableSort, RecordsTableSortDirection,
  RecordsTableStatusOption, RecordsTableTone, RecordsTableValue,
} from "./records-table.logic";

const attrs = useAttrs();
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

const props = withDefaults(
  defineProps<{
    columns: ReadonlyArray<RecordsTableColumn>;
    rows?: ReadonlyArray<RecordsTableRow>;
    /** Entries of the menu at the end of every row (one menu shared by all rows). Without them the rows have no menu. */
    rowActions?: ReadonlyArray<RecordsTableAction>;
    /** Locale of the number cells (grouping, decimals). Default en-US. */
    locale?: string;
    labels?: Partial<RecordsTableLabels>;
    /** `@row-open`: a row was opened (a click on it, not on its checkbox, link or menu; Enter on the
     * focused row). With it the rows are one tab stop; the arrow keys move, Space selects. Declared as
     * a prop so the table knows whether anyone listens. */
    onRowOpen?: (rowId: string) => void;
  }>(),
  { rows: () => [], rowActions: undefined, locale: DEFAULT_LOCALE, labels: undefined, onRowOpen: undefined },
);

/** v-model:sort, v-model:selected, v-model:hiddenColumns — each falls back to local state when unbound. */
const sort = defineModel<RecordsTableSort>("sort", { default: null });
const selected = defineModel<ReadonlyArray<string>>("selected", { default: () => [] });
const hiddenColumns = defineModel<ReadonlyArray<string>>("hiddenColumns", { default: () => [] });
const emit = defineEmits<{
  sortChange: [sort: RecordsTableSort];
  selectedChange: [selected: string[]];
  hiddenColumnsChange: [hidden: string[]];
  rowAction: [value: string, rowId: string];
}>();

/** selectionActions: bulk actions in the selection bar, after the count ({ selected }: the selected ids) */
const slots = defineSlots<{ selectionActions?: (scope: { selected: string[] }) => unknown }>();

const copy = computed(() => recordsLabels(props.labels));
const display = computed(() => sortRows(props.rows, props.columns, sort.value));
const ids = computed(() => props.rows.map((row) => row.id));
const on = computed(() => new Set(selected.value));
const count = computed(() => selectedCount(ids.value, selected.value));
const all = computed(() => selectAllState(ids.value, selected.value));
/* opening a row: the rows are one tab stop, the last one focused (the first at the start) */
const openable = computed(() => !!props.onRowOpen);
const focusId = ref<string | null>(null);
const tabRow = computed(() => (openable.value ? (display.value.some((row) => row.id === focusId.value) ? focusId.value : display.value[0]?.id ?? null) : null));
function rowClick(event: MouseEvent, id: string) { if (props.onRowOpen && rowClickOpens(event)) props.onRowOpen(id); }
function rowKeydown(event: KeyboardEvent, id: string) { if (props.onRowOpen && rowKey(event) === "open") props.onRowOpen(id); }
function rowFocus(event: FocusEvent, id: string) { if (event.target === event.currentTarget) focusId.value = id; }
const selectedHere = computed(() => selected.value.filter((id) => ids.value.includes(id)));
const hideable = computed(() => props.columns.filter((column, index) => isHideable(column, index)));
const columnsMenu = computed<MenuEntry[]>(() => [
  { type: "group", label: copy.value.columns, items: hideable.value.map((column) => ({ type: "checkbox" as const, value: column.key, label: column.label, checked: !hiddenColumns.value.includes(column.key) })) },
]);
const actions = computed(() => props.rowActions ?? []);
/* The row menu is one Zag menu with a trigger per row (the trigger's value is the row id). Its
 * machine lives here, not in a Menu.Root around the table (the column menus would nest in it); the
 * rows read their trigger props from an api that changes only when the menu opens, closes or moves
 * to another row, so sorting and selecting never touch the triggers. */
let activeRow: string | null = null;
const rowMenu = useMenu({
  positioning: { placement: "bottom-end", gutter: 4 },
  onTriggerValueChange: (details) => { activeRow = details.value; },
  onSelect: (details) => { if (activeRow !== null) emit("rowAction", details.value, activeRow); },
});
let cached: { open: boolean; value: string | null; api: typeof rowMenu.api.value } | null = null;
const triggerApi = computed(() => {
  const api = rowMenu.api.value;
  if (!cached || cached.open !== api.open || cached.value !== api.triggerValue) cached = { open: api.open, value: api.triggerValue, api };
  return cached.api;
});
/* the menu's trigger props, passed through the Tooltip to the button (they win over the tooltip's) */
const rowTriggerProps = (rowId: string) => triggerApi.value.getTriggerProps({ value: rowId }) as Record<string, unknown>;
const rowContent = ref<{ $el: HTMLElement } | null>(null);
const rowHighlight = ref<HTMLElement | null>(null);
let stopGlide: (() => void) | undefined;

function setSort(next: RecordsTableSort) {
  sort.value = next;
  emit("sortChange", next);
}
function setSelected(next: string[]) {
  selected.value = next;
  emit("selectedChange", next);
}
function setHidden(next: string[]) {
  hiddenColumns.value = next;
  emit("hiddenColumnsChange", next);
}

const root = ref<HTMLElement | null>(null);
function columnMenu(column: RecordsTableColumn, index: number): MenuEntry[] {
  return [
    ...(isSortable(column) ? [
      { value: "sort-ascending", label: copy.value.sortAscending, icon: PhArrowUp },
      { value: "sort-descending", label: copy.value.sortDescending, icon: PhArrowDown },
    ] : []),
    ...(isSortable(column) && isHideable(column, index) ? [{ type: "separator" as const }] : []),
    ...(isHideable(column, index) ? [{ value: "hide", label: copy.value.hideColumn, icon: PhEyeSlash }] : []),
  ];
}
function onColumnMenu(column: RecordsTableColumn, value: string) {
  if (value === "sort-ascending" || value === "sort-descending") setSort({ key: column.key, direction: value === "sort-ascending" ? "ascending" : "descending" });
  if (value === "hide") {
    setHidden(toggleHidden(hiddenColumns.value, column.key, true));
    /* the hidden column took its menu trigger with it: focus moves to the Columns menu, where it can come back */
    setTimeout(() => root.value?.querySelector<HTMLElement>("[data-records-table=columns-menu] [data-menu=trigger]")?.focus(), 0);
  }
}
const tagsOf = (value: unknown): string[] => (Array.isArray(value) ? value : [textOf(value as string)]);
const cellValue = (column: RecordsTableColumn, row: RecordsTableRow) => {
  const value = row[column.key];
  const type = columnType(column);
  return !isBlank(value) && (type === "number" || type === "status") ? textOf(value) : undefined;
};

onMounted(() => {
  trackModality();
  if (rowContent.value?.$el && rowHighlight.value) stopGlide = glide(rowContent.value.$el, rowHighlight.value, { rows: "[data-slot=menu-item]", follow: "highlighted" });
});
onBeforeUnmount(() => stopGlide?.());
</script>

<template>
  <div ref="root" v-bind="attrs" data-slot="records-table" :class="r.base({ class: attrs.class as string | undefined })">
    <div data-slot="records-table-scroll" :class="r.scroll()" role="region" :aria-label="copy.region" tabindex="0">
      <table data-slot="records-table-table" :class="r.table()" :style="{ minWidth: `${tableMinWidth(columns, hiddenColumns)}px` }">
        <thead>
          <tr data-slot="records-table-head-row" :class="r.headRow()">
            <th
              v-for="(column, index) in columns"
              :key="column.key"
              data-slot="records-table-th" :class="r.th(thv(column, index))"
              scope="col"
              :data-col="column.key"
              :aria-sort="isSortable(column) ? ariaSort(sort, column.key) : undefined"
              :hidden="hiddenColumns.includes(column.key)"
              :style="{ '--fndn-col-width': `${columnWidth(column, index)}px` }"
            >
              <div data-slot="records-table-th-inner" :class="r.thInner(thv(column, index))">
                <span v-if="index === 0" data-slot="records-table-gutter" :class="r.gutter()">
                  <Checkbox data-records-table="check" :class="r.check()" :checked="all" :disabled="!ids.length" :aria-label="copy.selectAll" @update:checked="setSelected(toggleAll(ids, selected))" />
                </span>
                <button v-if="isSortable(column)" type="button" data-slot="records-table-sort" :class="r.sort(thv(column, index))" @click="setSort(nextSort(sort, column.key))">
                  <span data-slot="records-table-th-label" :class="r.thLabel(thv(column, index))">{{ column.label }}</span>
                  <span data-slot="records-table-sort-icon" :class="r.sortIcon()" aria-hidden="true"><PhArrowDown data-slot="icon" weight="bold" /></span>
                </button>
                <span v-else data-slot="records-table-th-label" :class="r.thLabel(thv(column, index))">{{ column.label }}</span>
                <Menu
                  v-if="columnMenu(column, index).length"
                  data-records-table="col-menu"
                  :class="r.colMenu(thv(column, index))"
                  :items="columnMenu(column, index)"
                  placement="bottom-end"
                  @select="(value: string) => onColumnMenu(column, value)"
                >
                  <template #trigger>
                    <Tooltip :content="fillLabel(copy.columnMenu, { column: column.label })">
                      <Button data-menu="trigger" data-records-table="menu-trigger" :class="TRIGGER_CLASS.column" variant="ghost" size="xs" shape="rounded" square muted :aria-label="fillLabel(copy.columnMenu, { column: column.label })">
                        <template #icon><PhDotsThree data-slot="icon" weight="bold" /></template>
                      </Button>
                    </Tooltip>
                  </template>
                </Menu>
              </div>
            </th>
            <th data-slot="records-table-th" :class="r.th({ actions: true })" scope="col" :style="{ '--fndn-col-width': `${ACTIONS_WIDTH}px` }">
              <Menu
                v-if="hideable.length"
                data-records-table="columns-menu"
                :class="r.columnsMenu()"
                placement="bottom-end"
                :items="columnsMenu"
                @checked-change="(key: string, checked: boolean) => setHidden(toggleHidden(hiddenColumns, key, !checked))"
              >
                <template #trigger>
                  <Tooltip :content="copy.columns">
                    <Button data-menu="trigger" data-records-table="menu-trigger" :class="TRIGGER_CLASS.columns" variant="ghost" size="xs" shape="rounded" square muted :aria-label="copy.columns">
                      <template #icon><PhColumns data-slot="icon" weight="bold" /></template>
                    </Button>
                  </Tooltip>
                </template>
              </Menu>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="display.length">
            <tr
              v-for="row in display"
              :key="row.id"
              data-slot="records-table-row" :class="(openable ? OPEN_ROW : ROW)[on.has(row.id) ? 1 : 0]"
              :data-id="row.id"
              :tabindex="openable ? (tabRow === row.id ? 0 : -1) : undefined"
              v-memo="[row, on.has(row.id), hiddenColumns, copy, locale, actions.length, triggerApi, openable, tabRow === row.id]"
              @click="rowClick($event, row.id)"
              @keydown="rowKeydown($event, row.id)"
              @focus="rowFocus($event, row.id)"
            >
              <td
                v-for="(column, index) in columns"
                :key="column.key"
                data-slot="records-table-cell" :class="cellClass(columnType(column), index === 0)"
                :data-col="column.key"
                :data-value="cellValue(column, row)"
                :hidden="hiddenColumns.includes(column.key)"
                v-memo="[row, column, hiddenColumns, locale, index === 0 && on.has(row.id), index === 0 && copy]"
              >
                <div v-if="index === 0" data-slot="records-table-primary" :class="r.primary()">
                  <span data-slot="records-table-gutter" :class="r.gutter()">
                    <span data-slot="records-table-rownum" :class="ROWNUM[on.has(row.id) ? 1 : 0]" aria-hidden="true" />
                    <Checkbox data-records-table="check"
                      :class="BODY_CHECK[on.has(row.id) ? 1 : 0]"
                      :checked="on.has(row.id)"
                      :aria-label="fillLabel(copy.selectRow, { row: rowName(row, columns) })"
                      @update:checked="(checked: boolean | 'indeterminate') => setSelected(toggleOne(selected, row.id, checked === true))"
                    />
                  </span>
                  <span v-if="isBlank(row[column.key])" data-slot="records-table-blank" :class="r.blank()">—</span>
                  <span v-else data-slot="records-table-text" :class="r.text()" :title="textOf(row[column.key])">{{ textOf(row[column.key]) }}</span>
                </div>
                <span v-else-if="isBlank(row[column.key])" data-slot="records-table-blank" :class="r.blank()">—</span>
                <span v-else-if="columnType(column) === 'number'" data-slot="records-table-number" :class="r.number()">{{ formatNumber(row[column.key], locale) }}</span>
                <span v-else-if="columnType(column) === 'status'" data-slot="records-table-status" :class="r.status({ tone: statusOption(column, row[column.key])?.tone ?? 'neutral' })"><span data-slot="records-table-dot" :class="r.dot()" aria-hidden="true"></span>{{ statusOption(column, row[column.key])?.label ?? textOf(row[column.key]) }}</span>
                <span v-else-if="columnType(column) === 'tags'" data-slot="records-table-tags" :class="r.tags()" :title="tagsOf(row[column.key]).join(', ')">
                  <Tag v-for="(tag, i) in tagsOf(row[column.key]).slice(0, MAX_TAGS)" :key="i" :tone="tagTone(tag, column)">{{ tag }}</Tag>
                  <Count v-if="tagsOf(row[column.key]).length > MAX_TAGS" variant="boxed">{{ `+${tagsOf(row[column.key]).length - MAX_TAGS}` }}</Count>
                </span>
                <a v-else-if="columnType(column) === 'link'" data-slot="records-table-link" :class="r.link()" :href="linkHref(textOf(row[column.key]))" target="_blank" rel="noreferrer" :title="textOf(row[column.key])">
                  <span data-slot="records-table-link-text" :class="r.linkText()">{{ textOf(row[column.key]) }}</span><PhArrowSquareOut data-slot="icon" weight="bold" aria-hidden="true" />
                </a>
                <span v-else data-slot="records-table-text" :class="r.text()" :title="textOf(row[column.key])">{{ textOf(row[column.key]) }}</span>
              </td>
              <td data-slot="records-table-cell" :class="ACTION_CELL" v-memo="[row, copy, actions.length, triggerApi]">
                <Tooltip v-if="actions.length" :content="fillLabel(copy.rowActions, { row: rowName(row, columns) })" v-bind="rowTriggerProps(row.id)">
                  <Button data-menu="trigger" data-records-table="menu-trigger" :class="TRIGGER_CLASS.row" variant="ghost" size="xs" shape="rounded" square muted :aria-label="fillLabel(copy.rowActions, { row: rowName(row, columns) })">
                    <template #icon><PhDotsThree data-slot="icon" weight="bold" /></template>
                  </Button>
                </Tooltip>
              </td>
            </tr>
          </template>
          <tr v-else data-slot="records-table-empty-row" :class="r.emptyRow()">
            <td data-slot="records-table-empty" :class="r.empty()" :colspan="visibleSpan(columns, hiddenColumns)"><EmptyState :title="copy.empty" icon="table" size="block" /></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div data-slot="records-table-selection" :class="r.selection({ open: count > 0 })" :inert="count === 0 || undefined">
      <div data-slot="records-table-selection-inner" :class="r.selectionInner()">
        <span data-slot="records-table-selection-count" :class="r.selectionCount()" role="status">{{ fillLabel(copy.selected, { count }) }}</span>
        <div v-if="slots.selectionActions" data-slot="records-table-selection-actions" :class="r.selectionActions()"><slot name="selectionActions" :selected="selectedHere" /></div>
        <Button data-records-table="selection-clear" :class="r.selectionClear()" variant="ghost" size="sm" @click="setSelected(selected.filter((id) => !ids.includes(id)))">
          {{ copy.clearSelection }}
        </Button>
      </div>
    </div>
  </div>
  <ArkMenu.RootProvider v-if="actions.length" :value="rowMenu">
  <Teleport to="body">
    <ArkMenu.Positioner data-slot="menu-positioner" data-records-table="row-menu" :class="ROW_MENU_POSITIONER">
      <ArkMenu.Content ref="rowContent" data-slot="menu-content" :class="m.content()">
        <span ref="rowHighlight" data-slot="menu-highlight" :class="m.highlight()" aria-hidden="true" />
        <template v-for="(item, index) in actions" :key="item.type === 'separator' ? `separator-${index}` : item.value">
          <ArkMenu.Separator v-if="item.type === 'separator'" data-slot="menu-separator" :class="m.separator()" />
          <ArkMenu.Item v-else :value="item.value" :disabled="item.disabled" data-slot="menu-item" :class="m.item({ tone: item.tone })">
            <span data-slot="menu-item-text" :class="m.itemText()">{{ item.label }}</span>
          </ArkMenu.Item>
        </template>
      </ArkMenu.Content>
    </ArkMenu.Positioner>
  </Teleport>
  </ArkMenu.RootProvider>
</template>
