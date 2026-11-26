<script setup lang="ts">
/** AI-proposed edits in tabular data; each changed row toggles its edit. */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs } from "vue";
import Button from "../button/Button.vue";
import Checkbox from "../checkbox/Checkbox.vue";
import { diffTable } from "./diff-table.recipe";
import EmptyState from "../empty-state/EmptyState.vue";
import StatusPill from "../status-pill/StatusPill.vue";
import { DIFF_TABLE_BOX, DIFF_TABLE_LABELS, diffTableKey, diffTableText, focusRowMark, isBoxClick, type DiffTableLabels } from "./diff-table.logic";
import { trackModality } from "../lib/modality";
import { afterPaint } from "../lib/paint";

export type { DiffTableLabels } from "./diff-table.logic";
export type DiffTableTone = "accent" | "neutral" | "orange" | "green";
export type DiffTableChange = "removed" | "added" | "unchanged";
export type DiffTableRow = { key: string; name: string; category: string; tone?: DiffTableTone; value: string; change: DiffTableChange };

const props = withDefaults(
  defineProps<{ title?: string; columns?: [string, string, string]; rows?: DiffTableRow[]; labels?: Partial<DiffTableLabels> }>(),
  { title: "Proposed changes", columns: () => ["Name", "Category", "Value"], rows: () => [], labels: undefined },
);
/** v-model:included — key → included; every changed row starts included. */
const included = defineModel<Record<string, boolean>>("included", { default: () => ({}) });
/** v-model:accepted */
const accepted = defineModel<boolean>("accepted", { default: false });
const emit = defineEmits<{ toggle: [key: string, included: boolean]; apply: [included: Record<string, boolean>] }>();

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const s = diffTable();

const t = computed<DiffTableLabels>(() => ({ ...DIFF_TABLE_LABELS, ...props.labels }));
const changed = computed(() => props.rows.filter((r) => r.change !== "unchanged"));
const focusKey = ref<string | undefined>();
const tabKey = computed(() => (changed.value.some((r) => r.key === focusKey.value) ? focusKey.value : changed.value[0]?.key));
const isIn = (r: DiffTableRow) => r.change !== "unchanged" && (included.value[r.key] ?? true);
const text = computed(() => diffTableText(t.value, props.rows.filter((r) => r.change === "removed" && isIn(r)).length, props.rows.filter((r) => r.change === "added" && isIn(r)).length));
const root = ref<HTMLElement | null>(null);

function toggle(r: DiffTableRow, next = !isIn(r)) {
  if (accepted.value || r.change === "unchanged" || next === isIn(r)) return;
  included.value = { ...included.value, [r.key]: next };
  emit("toggle", r.key, next);
}
function onRowClick(r: DiffTableRow, event: MouseEvent) {
  if (accepted.value || r.change === "unchanged" || isBoxClick(event)) return;
  toggle(r);
  focusRowMark(event.currentTarget as HTMLElement);
}
function onRowKey(r: DiffTableRow, event: KeyboardEvent) {
  if (!accepted.value && r.change !== "unchanged" && (event.target as Element).matches(DIFF_TABLE_BOX)) diffTableKey(event, event.target as HTMLElement, () => toggle(r));
}
function onRowFocus(r: DiffTableRow, event: FocusEvent) {
  if ((event.target as Element).matches(DIFF_TABLE_BOX)) focusKey.value = r.key;
}
/* roving tab stop: the Checkbox takes the input's tabindex */
const tabOf = (r: DiffTableRow) => (accepted.value ? undefined : r.key === tabKey.value ? 0 : -1);
async function apply() {
  accepted.value = true;
  emit("apply", Object.fromEntries(changed.value.map((r) => [r.key, isIn(r)])));
  await nextTick();
  root.value?.querySelector<HTMLElement>("[data-diff-table=applied]")?.focus();
}

/* an added row reveals only once the table has been painted (lib/paint.ts) */
const enter = ref(false);
let cancelPaint: (() => void) | undefined;
onMounted(() => { trackModality(); cancelPaint = afterPaint(() => { enter.value = true; }); });
onBeforeUnmount(() => cancelPaint?.());
</script>

<template>
  <div ref="root" v-bind="attrs" data-slot="diff-table" :class="s.base({ class: attrs.class as string | undefined })" :data-enter="enter ? '' : undefined">
    <div data-slot="diff-table-card" :class="s.card()">
      <div data-slot="diff-table-bar" :class="s.bar()">
        <span data-slot="diff-table-title" :class="s.title()">{{ title }}</span>
        <span v-if="!accepted && changed.length > 0" data-slot="diff-table-hint" :class="s.hint()">{{ t.hint }}</span>
      </div>
      <table data-slot="diff-table-table" :class="s.table()">
        <colgroup><col data-slot="diff-table-col" :class="s.col({ col: 'name' })" /><col data-slot="diff-table-col" :class="s.col({ col: 'category' })" /><col data-slot="diff-table-col" :class="s.col({ col: 'value' })" /></colgroup>
        <thead><tr><th v-for="(h, i) in columns" :key="i" data-slot="diff-table-th" :class="s.th()" scope="col">{{ h }}</th></tr></thead>
        <tbody>
          <tr v-if="rows.length === 0">
            <td data-slot="diff-table-empty" :class="s.empty()" colspan="3"><EmptyState :title="t.empty" icon="table" size="block" /></td>
          </tr>
          <tr
            v-for="r in rows"
            :key="r.key"
            data-slot="diff-table-row"
            :class="s.row({ change: r.change, included: isIn(r), toggleable: r.change !== 'unchanged' && !accepted })"
            :data-key="r.key"
            @click="onRowClick(r, $event)"
            @keydown="onRowKey(r, $event)"
            @focusin="onRowFocus(r, $event)"
          >
            <template v-if="r.change === 'added'">
              <td data-slot="diff-table-cell" :class="s.cell({ change: r.change, included: isIn(r), col: 'name' })"><div data-slot="diff-table-reveal" :class="s.reveal()"><div><div data-slot="diff-table-pad" :class="s.pad()">{{ r.name }}</div></div></div></td>
              <td data-slot="diff-table-cell" :class="s.cell({ change: r.change, included: isIn(r), col: 'category' })"><div data-slot="diff-table-reveal" :class="s.reveal()"><div><div data-slot="diff-table-pad" :class="s.pad()"><StatusPill tone="neutral" size="sm" :dot-tone="r.tone && r.tone !== 'neutral' ? r.tone : undefined">{{ r.category }}</StatusPill></div></div></div></td>
              <td data-slot="diff-table-cell" :class="s.cell({ change: r.change, included: isIn(r), col: 'value' })"><div data-slot="diff-table-reveal" :class="s.reveal()"><div><div data-slot="diff-table-pad" :class="s.pad()"><span data-slot="diff-table-value" :class="s.value()"><span data-slot="diff-table-value-text" :class="s.valueText({ change: r.change, included: isIn(r) })" :title="r.value">{{ r.value }}</span><Checkbox size="md" tone="green" :aria-label="`${t.add} ${r.name}`" :checked="isIn(r)" :disabled="accepted" :tab-index="tabOf(r)" @checked-change="(c) => toggle(r, c === true)" /></span></div></div></div></td>
            </template>
            <template v-else>
              <td data-slot="diff-table-cell" :class="s.cell({ change: r.change, included: isIn(r), col: 'name' })">{{ r.name }}</td>
              <td data-slot="diff-table-cell" :class="s.cell({ change: r.change, included: isIn(r), col: 'category' })"><StatusPill tone="neutral" size="sm" :dot-tone="r.tone && r.tone !== 'neutral' ? r.tone : undefined">{{ r.category }}</StatusPill></td>
              <td data-slot="diff-table-cell" :class="s.cell({ change: r.change, included: isIn(r), col: 'value' })"><span data-slot="diff-table-value" :class="s.value()"><span data-slot="diff-table-value-text" :class="s.valueText({ change: r.change, included: isIn(r) })" :title="r.value">{{ r.value }}</span><Checkbox v-if="r.change === 'removed'" size="md" tone="red" :aria-label="`${t.remove} ${r.name}`" :checked="isIn(r)" :disabled="accepted" :tab-index="tabOf(r)" @checked-change="(c) => toggle(r, c === true)" /></span></td>
            </template>
          </tr>
        </tbody>
      </table>
      <div data-slot="diff-table-footer" :class="s.footer()">
        <StatusPill v-if="accepted" data-diff-table="applied" :class="s.applied()" tone="green" mark tabindex="-1" data-enter="">{{ text.applied }}</StatusPill>
        <template v-else>
          <span data-slot="diff-table-summary" :class="s.summary()">{{ text.summary }}</span>
          <Button v-if="changed.length > 0" variant="accent" size="sm" :disabled="text.total === 0" @click="apply">{{ text.apply }}</Button>
        </template>
      </div>
    </div>
  </div>
</template>
