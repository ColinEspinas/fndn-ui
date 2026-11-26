<script setup lang="ts">
/** Expandable agent trace, fully controlled. */
import { PhCheck, PhGlobe, PhMagnifyingGlass, PhSparkle } from "@phosphor-icons/vue";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs } from "vue";
import Collapsible from "../collapsible/Collapsible.vue";
import Shimmer from "../shimmer/Shimmer.vue";
import Spinner from "../spinner/Spinner.vue";
import { thinkingState } from "./thinking-state.recipe";

export type ThinkingRow = {
  primary: string;
  secondary?: string;
  mono?: boolean;
  add?: number;
  del?: number;
  href?: string;
};
export type ThinkingVariant = "steps" | "reasoning" | "search" | "coding";

const props = withDefaults(
  defineProps<{
    variant?: ThinkingVariant;
    working?: boolean;
    activeLabel?: string;
    doneLabel?: string;
    rows?: ThinkingRow[];
    /** search variant: the query shown above the sources */
    query?: string;
    /** search variant: trailer such as "+7 more" */
    more?: string;
    /** Rows are buttons with aria-pressed; defaults on for coding. */
    pressable?: boolean;
    /** @deprecated alias of pressable */
    pressableRows?: boolean;
    /** Enter on mount: the rows present at mount fade up, staggered. Off by default; set it on the trace your code adds live, never on one rendered from history or with the page. Rows added later enter either way. */
    appear?: boolean;
  }>(),
  { variant: "steps", working: false, activeLabel: "Thinking", doneLabel: "Done thinking", rows: () => [], query: undefined, more: undefined, pressable: undefined, pressableRows: false, appear: false },
);

/** v-model:expanded — falls back to local state when unbound. */
const expanded = defineModel<boolean>("expanded", { default: false });
/** v-model:selected — index of the pressed row, or null. */
const selected = defineModel<number | null>("selected", { default: null });
const emit = defineEmits<{ toggle: [expanded: boolean]; rowClick: [row: ThinkingRow, index: number] }>();

defineSlots<{ icon?: () => unknown }>();

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const r = computed(() => thinkingState({ variant: props.variant, working: props.working, ready: ready.value }));

const isPressable = computed(() => props.pressable ?? (props.variant === "coding" || props.pressableRows));
const TONES = ["accent", "orange", "green"] as const;

/* rows present at first render stagger in; a row that arrives later enters at once */
const initial = props.rows.length;
/* without appear, what is here at mount is simply there; what is added later enters */
const atMount = { appear: props.appear, query: Boolean(props.query), more: Boolean(props.more) };
const stagger = (i: number) => (i < initial ? { "--fndn-row-index": i } : undefined);

/* status swaps animate, first paint does not: the ready variant arms the entry transitions */
const ready = ref(false);

/* rail: grow to meet a row that arrives; any other size change (wrapping, fonts) is instant */
const list = ref<HTMLElement | null>(null);
const line = ref<HTMLElement | null>(null);
let observer: ResizeObserver | undefined;
let lastCount = -1;
function measure() {
  const rowsEl = list.value, lineEl = line.value;
  if (!rowsEl || !lineEl) return;
  const count = rowsEl.childElementCount;
  const grow = lastCount !== -1 && count !== lastCount;
  if (!grow) lineEl.style.transition = "none";
  lineEl.style.height = `${rowsEl.offsetHeight + 2}px`;
  lineEl.setAttribute("data-measured", "");
  if (!grow) { void lineEl.offsetHeight; lineEl.style.transition = ""; }
  lastCount = count;
}
onMounted(() => {
  ready.value = true;
  measure();
  if (list.value && typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(measure);
    observer.observe(list.value);
  }
});
onBeforeUnmount(() => observer?.disconnect());

function toggle(next: boolean) {
  expanded.value = next;
  emit("toggle", next);
}
function rowTag(row: ThinkingRow) {
  return row.href ? "a" : isPressable.value ? "button" : "div";
}
function pressRow(row: ThinkingRow, i: number) {
  if (row.href || !isPressable.value) return;
  selected.value = selected.value === i ? null : i;
  emit("rowClick", row, i);
}
</script>

<template>
  <div v-bind="attrs" data-slot="thinking-state" :class="r.base({ class: attrs.class as string | undefined })">
    <Collapsible variant="inline" caret="start" keep-layout :label-class="r.header()" :open="expanded" @open-change="toggle">
      <template #label>
        <span data-slot="thinking-state-icon" :class="r.icon()" aria-hidden="true">
          <slot name="icon">
            <PhSparkle data-slot="icon" weight="fill" aria-hidden="true" />
          </slot>
        </span>
        <span data-slot="thinking-state-label" :class="r.label()" role="status">
          <Shimmer v-if="working" key="working" data-thinking-state="label-text" speed="fast" :class="r.labelText()" :title="activeLabel">{{ activeLabel }}</Shimmer>
          <span v-else key="done" data-slot="thinking-state-label-text" :class="r.labelText()" :title="doneLabel">{{ doneLabel }}</span>
        </span>
      </template>
        <div data-slot="thinking-state-rail" :class="r.rail()">
          <span ref="line" data-slot="thinking-state-line" :class="r.line()" aria-hidden="true" />
          <div ref="list" data-slot="thinking-state-rows" :class="r.rows()">
            <div v-if="variant === 'search' && query" data-slot="thinking-state-query" :class="r.query({ appear: atMount.appear || !atMount.query })">
              <PhMagnifyingGlass data-slot="icon" weight="bold" aria-hidden="true" />
              <span>{{ query }}</span>
            </div>
            <component
              :is="rowTag(row)"
              v-for="(row, i) in rows"
              :key="i"
              data-slot="thinking-state-row"
              :class="r.row({ appear: atMount.appear || i >= initial })"
              :style="stagger(i)"
              :href="row.href"
              :target="row.href ? '_blank' : undefined"
              :rel="row.href ? 'noreferrer' : undefined"
              :type="!row.href && isPressable ? 'button' : undefined"
              :aria-pressed="!row.href && isPressable ? (selected === i ? 'true' : 'false') : undefined"
              @click="pressRow(row, i)"
            >
              <span v-if="variant === 'steps'" data-slot="thinking-state-check" :class="r.check()" aria-hidden="true">
                <Spinner v-if="working && i === rows.length - 1" size="sm" decorative />
                <PhCheck v-else data-slot="icon" weight="bold" aria-hidden="true" />
              </span>
              <span v-if="variant === 'search'" data-slot="thinking-state-dot" :class="r.dot({ tone: TONES[i % 3] })" aria-hidden="true">
                <PhGlobe data-slot="icon" weight="bold" aria-hidden="true" />
              </span>
              <span data-slot="thinking-state-primary" :class="r.primary()" :title="variant !== 'reasoning' ? row.primary : undefined">{{ row.primary }}</span>
              <span v-if="row.secondary" data-slot="thinking-state-secondary" :class="r.secondary({ mono: !!row.mono })" :title="row.secondary">{{ row.secondary }}</span>
              <span v-if="row.add !== undefined || row.del !== undefined" data-slot="thinking-state-diff" :class="r.diff()">
                <span v-if="row.add !== undefined" data-add="">+{{ row.add }}</span>
                <span v-if="row.del !== undefined" data-del="">−{{ row.del }}</span>
              </span>
            </component>
            <span v-if="variant === 'search' && more" data-slot="thinking-state-more" :class="r.more({ appear: atMount.appear || !atMount.more })" :style="{ '--fndn-row-index': initial }">{{ more }}</span>
          </div>
        </div>
    </Collapsible>
  </div>
</template>
