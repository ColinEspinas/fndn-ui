<script setup lang="ts">
/** An agent run as compact rows with file-diff chips, fully controlled. */
import { PhFileText, PhImage, PhMagnifyingGlass, PhPencilSimple, PhSparkle, PhTerminal } from "@phosphor-icons/vue";
import { computed, useAttrs, type Component } from "vue";
import Collapsible from "../collapsible/Collapsible.vue";
import HoverCard, { type HoverCardLine } from "../hover-card/HoverCard.vue";
import { hoverCard } from "../hover-card/hover-card.recipe";
import { toolChips } from "./tool-chips.recipe";

/** Built-in tool glyphs by name. */
export type ToolChipsIconName = "think" | "write" | "run" | "read" | "image" | "search";
/** A step's icon: a built-in name, or any Vue component (e.g. a Phosphor icon). Defaults to "think"; the `icon` scoped slot overrides per step. */
export type ToolChipsIcon = ToolChipsIconName | Component;
export type ToolDetailLine = { text: string; tone?: "add" };
export type ToolStep = {
  /** Stable id; defaults to the label. Used by v-model:openRows. */
  key?: string;
  icon?: ToolChipsIcon;
  label: string;
  chip: string;
  mono?: boolean;
  detailMono?: boolean;
  detail: ToolDetailLine[];
};
/** A changed file. `lines` is the preview its hover-card shows. */
export type ToolDiff = { file: string; add: number; del: number; lines?: HoverCardLine[] };
export type ToolChipsLabels = { header: string; more: string };

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const r = toolChips();

const props = withDefaults(
  defineProps<{
    steps?: ToolStep[];
    diffs?: ToolDiff[];
    labels?: Partial<ToolChipsLabels>;
    /** Enter on mount: the steps present at mount fade up, staggered, then the diff row. Off by default; set it on the run your code adds live, never on one rendered from history or with the page. Steps and diffs added later enter either way. */
    appear?: boolean;
  }>(),
  { steps: () => [], diffs: () => [], labels: undefined, appear: false },
);
/** v-model:open — the run; falls back to local state when unbound. */
const open = defineModel<boolean>("open", { default: true });
/** v-model:openRows — keys (step.key ?? step.label) of expanded steps. */
const openRows = defineModel<string[]>("openRows", { default: () => [] });
defineSlots<{ icon?: (props: { step: ToolStep }) => unknown }>();
const emit = defineEmits<{ openChange: [open: boolean]; toggleRow: [label: string, open: boolean]; diffClick: [file: string]; moreClick: [] }>();

const GLYPHS: Record<ToolChipsIconName, { is: Component; weight: "fill" | "bold" }> = {
  think: { is: PhSparkle, weight: "fill" },
  write: { is: PhPencilSimple, weight: "bold" },
  run: { is: PhTerminal, weight: "bold" },
  read: { is: PhFileText, weight: "bold" },
  image: { is: PhImage, weight: "bold" },
  search: { is: PhMagnifyingGlass, weight: "bold" },
};
const glyph = (icon: ToolChipsIcon | undefined) =>
  icon === undefined ? GLYPHS.think : typeof icon === "string" ? (GLYPHS[icon as ToolChipsIconName] ?? GLYPHS.think) : { is: icon, weight: "bold" as const };
const keyOf = (step: ToolStep) => step.key ?? step.label;

/* steps present at first render stagger in, the diff row one beat after them;
 * anything that arrives later enters at once */
const initial = { steps: props.steps.length, diffs: props.diffs.length > 0, appear: props.appear };
/* a step that arrives later opens its room as it fades (--fndn-row-room, read by the recipe) */
const stagger = (i: number) => (i < initial.steps ? { "--fndn-row-index": i } : { "--fndn-row-room": "0fr" });
const diffsStyle = initial.diffs ? { "--fndn-row-index": initial.steps } : undefined;

function toggleRun(n: boolean) { open.value = n; emit("openChange", n); }
function toggleRow(step: ToolStep, n: boolean) {
  const k = keyOf(step);
  openRows.value = n ? [...openRows.value.filter((x) => x !== k), k] : openRows.value.filter((x) => x !== k);
  emit("toggleRow", step.label, n);
}
const header = computed(() => props.labels?.header ?? `${props.steps.length} tool call${props.steps.length === 1 ? "" : "s"}`);
const more = computed(() => props.labels?.more ?? "");

</script>

<template>
  <div v-bind="attrs" data-slot="tool-chips" :class="r.base({ class: attrs.class as string | undefined })">
    <Collapsible :class="r.run()" data-tool-chips="run" variant="inline" caret="start" keep-layout :open="open" :label="header" @open-change="toggleRun">
      <div data-slot="tool-chips-rows" :class="r.rows()">
        <Collapsible
          v-for="(step, i) in steps"
          :key="keyOf(step)"
          :class="r.step({ appear: initial.appear || i >= initial.steps })"
          data-tool-chips="step"
          :style="stagger(i)"
          variant="inline"
          caret="start"
          :open="openRows.includes(keyOf(step))"
          @open-change="(n: boolean) => toggleRow(step, n)"
        >
          <template #label>
            <span data-slot="tool-chips-icon" :class="r.icon()" aria-hidden="true">
              <slot name="icon" :step="step"><component :is="glyph(step.icon).is" data-slot="icon" :weight="glyph(step.icon).weight" aria-hidden="true" /></slot>
            </span>
            <span data-slot="tool-chips-label" :class="r.label()" :title="step.label">{{ step.label }}</span>
            <span data-slot="tool-chips-value" :class="r.value({ mono: !!step.mono })" :title="step.chip"><span>{{ step.chip }}</span></span>
          </template>
          <div data-slot="tool-chips-lines" :class="r.lines({ mono: !!step.detailMono })">
            <span v-for="(line, j) in step.detail" :key="j" data-slot="tool-chips-line" :class="r.line({ tone: line.tone })" :title="line.text">{{ line.text }}</span>
          </div>
        </Collapsible>
      </div>
      <div v-if="diffs.length > 0" data-slot="tool-chips-diffs" :class="r.diffs({ appear: initial.appear || !initial.diffs })" :style="diffsStyle">
        <span v-for="(d, i) in diffs" :key="d.file" data-slot="tool-chips-file" :class="r.file({ withMore: !!more && i === diffs.length - 1 })">
          <HoverCard :title="d.file" :add="d.add" :del="d.del > 0 ? d.del : undefined" :lines="d.lines">
            <template #trigger>
              <button type="button" data-slot="tool-chips-diff" data-hover-card="trigger" :class="hoverCard().trigger({ class: r.diff() })" @click="emit('diffClick', d.file)">
                <span :title="d.file">{{ d.file }}</span>
                <span data-slot="tool-chips-add" :class="r.add()">{{ `+${d.add}` }}</span>
                <span v-if="d.del > 0" data-slot="tool-chips-del" :class="r.del()">{{ `−${d.del}` }}</span>
              </button>
            </template>
          </HoverCard>
          <button v-if="more && i === diffs.length - 1" type="button" data-slot="tool-chips-more" :class="r.more()" @click="emit('moreClick')">{{ more }}</button>
        </span>
      </div>
    </Collapsible>
  </div>
</template>
