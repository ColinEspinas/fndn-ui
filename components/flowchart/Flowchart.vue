<script setup lang="ts">
/** An agent workflow: a trigger and If / Else conditions. */
import { PhCaretDown, PhDatabase, PhDotsSixVertical, PhLightning, PhPlus } from "@phosphor-icons/vue";
import { computed, ref, useAttrs, watch } from "vue";
import {
  addCondition, applyRowAction, choicesOf, flowchartLabels, focusAfter, handleLabel, joinerOf, propertyLabel, revealRow, rowActions,
  setProperty, setValue, valueLabel,
  type FlowchartChoices, type FlowchartCondition, type FlowchartLabels, type FlowchartOption, type FlowchartTrigger, type Focus, type RowAction,
} from "./flowchart.logic";
import Button from "../button/Button.vue";
import { flowchart } from "./flowchart.recipe";
import Tooltip from "../tooltip/Tooltip.vue";
import Menu, { type MenuEntry } from "../menu/Menu.vue";
import Select from "../select/Select.vue";

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const r = flowchart();
const props = withDefaults(
  defineProps<{
    /** What can start the workflow. */
    triggers: ReadonlyArray<FlowchartTrigger>;
    /** Name of the record the conditions read. */
    source?: string;
    /** Properties a condition can test. */
    properties: ReadonlyArray<FlowchartOption>;
    /** Values per property. */
    choices: FlowchartChoices;
    /** The fixed strings ({n} is a row's number); the rest stays English. */
    labels?: Partial<FlowchartLabels>;
  }>(),
  { source: "record" },
);

/** v-model:trigger and v-model:conditions — fall back to local state when unbound. */
const trigger = defineModel<string>("trigger");
const conditions = defineModel<ReadonlyArray<FlowchartCondition>>("conditions", { default: () => [] });
const emit = defineEmits<{ triggerChange: [value: string]; conditionsChange: [conditions: FlowchartCondition[]] }>();

const root = ref<HTMLElement | null>(null);
const t = computed(() => flowchartLabels(props.labels));
const current = computed(() => trigger.value ?? props.triggers[0]?.value ?? "");
const picked = computed(() => props.triggers.find((t) => t.value === current.value));
const list = computed(() => conditions.value ?? []);
const triggerItems = computed<MenuEntry[]>(() => [
  { type: "radio-group", name: "trigger", value: current.value, closeOnSelect: true, items: props.triggers.map((t) => ({ value: t.value, label: t.label })) },
]);

/* focus and the one-shot reveal run once the new list is on screen */
let pending: { focus: Focus; reveal?: number } | null = null;
watch(list, () => {
  const next = pending;
  if (!next || !root.value) return;
  pending = null;
  if (next.reveal !== undefined) revealRow(root.value, next.reveal);
  focusAfter(root.value, next.focus);
}, { flush: "post" });

function commit(next: FlowchartCondition[], after?: { focus: Focus; reveal?: number }) {
  pending = after ?? null;
  conditions.value = next;
  emit("conditionsChange", next);
}
function pickTrigger(value: string) {
  if (value === current.value) return;
  trigger.value = value;
  emit("triggerChange", value);
}
function act(index: number, action: string) {
  const { next, focus } = applyRowAction(list.value, index, action as RowAction);
  commit(next, { focus });
}
function addRow() {
  const { next, focus } = addCondition(list.value, props.properties, props.choices);
  commit(next, { focus, reveal: next.length - 1 });
}
function onProperty(index: number, value: string | null) {
  if (value != null && value !== list.value[index]?.property) commit(setProperty(list.value, index, value, props.choices));
}
function onValue(index: number, value: string | null) {
  if (value != null && value !== list.value[index]?.value) commit(setValue(list.value, index, value));
}
</script>

<template>
  <div ref="root" v-bind="attrs" data-slot="flowchart" :class="r.base({ class: attrs.class as string | undefined })">
    <div data-slot="flowchart-node" :class="r.node({ kind: 'trigger' })">
      <span data-slot="flowchart-kind" :class="r.kind({ kind: 'trigger' })">{{ t.trigger }}</span>
      <Menu :items="triggerItems" @radio-change="(_name: string, value: string) => pickTrigger(value)">
        <template #trigger>
          <button data-menu="trigger" data-slot="flowchart-card" :class="r.card({ kind: 'trigger' })" type="button">
            <span data-slot="flowchart-icon" :class="r.icon()" aria-hidden="true"><PhLightning data-slot="icon" weight="bold" /></span>
            <span data-slot="flowchart-text" :class="r.text()">
              <span data-slot="flowchart-title" :class="r.title()">{{ picked?.label ?? "" }}</span>
              <span v-if="picked?.caption" data-slot="flowchart-caption" :class="r.caption()">{{ picked.caption }}</span>
            </span>
            <span data-slot="flowchart-caret" :class="r.caret()" aria-hidden="true"><PhCaretDown data-slot="icon" weight="bold" /></span>
          </button>
        </template>
      </Menu>
    </div>
    <div data-slot="flowchart-edge" :class="r.edge()" aria-hidden="true" />
    <div data-slot="flowchart-node" :class="r.node({ kind: 'condition' })">
      <span data-slot="flowchart-kind" :class="r.kind({ kind: 'condition' })">{{ t.condition }}</span>
      <div data-slot="flowchart-card" :class="r.card({ kind: 'condition' })" role="group" :aria-label="t.conditions">
        <ol data-slot="flowchart-conditions" :class="r.conditions()">
          <li v-for="(c, i) in list" :key="c.id" data-slot="flowchart-row" :class="r.row()">
            <Menu :items="(rowActions(i, list.length, t) as MenuEntry[])" @select="(value: string) => act(i, value)">
              <template #trigger>
                <Tooltip :content="handleLabel(i, t)">
                  <button data-menu="trigger" data-slot="flowchart-handle" :class="r.handle()" type="button" :aria-label="handleLabel(i, t)">
                    <PhDotsSixVertical data-slot="icon" weight="bold" />
                  </button>
                </Tooltip>
              </template>
            </Menu>
            <span data-slot="flowchart-joiner" :class="r.joiner()">{{ joinerOf(i, t) }}</span>
            <span data-slot="flowchart-clause" :class="r.clause()">
              <span data-slot="flowchart-source" :class="r.source()" :title="source"><span data-slot="flowchart-source-icon" :class="r.sourceIcon()" aria-hidden="true"><PhDatabase data-slot="icon" weight="bold" /></span><span data-slot="flowchart-source-text" :class="r.sourceText()">{{ source }}</span></span>
              <Select :items="properties" :value="c.property" size="sm" variant="ghost" :aria-label="propertyLabel(i, t)" @value-change="(value: string | null) => onProperty(i, value)" />
              <span data-slot="flowchart-operator" :class="r.operator()">{{ t.is }}</span>
              <Select :items="choicesOf(choices, c.property)" :value="c.value" size="sm" variant="ghost" :aria-label="valueLabel(i, t)" @value-change="(value: string | null) => onValue(i, value)" />
            </span>
          </li>
        </ol>
        <Button data-flowchart="add" :class="r.add()" variant="ghost" size="sm" @click="addRow">
          <template #icon><PhPlus data-slot="icon" weight="bold" /></template>{{ t.addCondition }}
        </Button>
      </div>
    </div>
  </div>
</template>
