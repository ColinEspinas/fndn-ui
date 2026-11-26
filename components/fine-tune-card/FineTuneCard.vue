<script setup lang="ts">
/** Compact inspector: layout, scrubbable number fields, type. Fields by Ark UI (Zag number-input). */
import { NumberInput } from "@ark-ui/vue/number-input";
import { PhArrowCounterClockwise, PhCheck, PhColumns, PhRows, PhSparkle, PhSquaresFour } from "@phosphor-icons/vue";
import { computed, onMounted, ref, useAttrs, watch } from "vue";
import Button from "../button/Button.vue";
import { fineTuneCard } from "./fine-tune-card.recipe";
import SegmentedControl from "../segmented-control/SegmentedControl.vue";
import Select, { type SelectItem } from "../select/Select.vue";
import Shimmer from "../shimmer/Shimmer.vue";
import {
  FINE_TUNE_FIELDS, FINE_TUNE_LAYOUTS, FINE_TUNE_TYPES, fieldValue, fineTuneLabels, focusAfterReset, isEdited, pageStep,
  type FineTuneField as Field, type FineTuneLabels as Labels, type FineTuneLayout as Layout,
} from "./fine-tune-card.logic";
import { trackModality } from "../lib/modality";

export type FineTuneField = Field;
export type FineTuneLabels = Labels;
export type FineTuneLayout = Layout;

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const r = fineTuneCard();

const props = withDefaults(
  defineProps<{
    /** The number properties, laid out in pairs. `value` is each field's default (what Reset returns to). */
    fields?: ReadonlyArray<FineTuneField>;
    /** Options of the type picker. Strings are accepted as value = label. */
    types?: ReadonlyArray<SelectItem | string>;
    labels?: Partial<FineTuneLabels>;
  }>(),
  { fields: () => FINE_TUNE_FIELDS, types: () => FINE_TUNE_TYPES, labels: () => ({}) },
);

/** v-model:values, v-model:layout, v-model:type, v-model:changed — local state when unbound. */
const values = defineModel<Record<string, number>>("values", { default: () => ({}) });
const layout = defineModel<FineTuneLayout>("layout", { default: "row" });
const type = defineModel<string | null>("type", { default: null });
/** Unbound, the edited state follows the card (anything differs from where it started). */
const changed = defineModel<boolean | undefined>("changed", { default: undefined });
const emit = defineEmits<{
  valuesChange: [values: Record<string, number>];
  layoutChange: [layout: FineTuneLayout];
  typeChange: [type: string | null];
  changedChange: [changed: boolean];
  reset: [];
}>();

const text = computed(() => fineTuneLabels(props.labels));
const initial = { layout: layout.value, type: type.value };
const root = ref<HTMLElement | null>(null);
onMounted(() => trackModality());

const icons = { row: PhColumns, col: PhRows, grid: PhSquaresFour } as const;
const layoutOptions = computed(() => FINE_TUNE_LAYOUTS.map((value) => ({ value, label: text.value[value] })));
const iconOf = (value: string) => icons[value as FineTuneLayout];

const derived = computed(() =>
  isEdited({ fields: props.fields, values: values.value, layout: layout.value, initialLayout: initial.layout, type: type.value, initialType: initial.type }),
);
const isChanged = computed(() => changed.value ?? derived.value);
watch(derived, (next) => {
  changed.value = next;
  emit("changedChange", next);
});

function setValues(next: Record<string, number>) { values.value = next; emit("valuesChange", next); }
function setLayout(next: string | undefined) { if (!next) return; layout.value = next as FineTuneLayout; emit("layoutChange", layout.value); }
function setType(next: string | null) { type.value = next; emit("typeChange", next); }
function setField(key: string, next: number) { setValues({ ...values.value, [key]: next }); }
function onValue(f: FineTuneField, n: number) { if (Number.isFinite(n) && n !== fieldValue(f, values.value)) setField(f.key, n); }
function onPage(event: KeyboardEvent, f: FineTuneField) {
  const v = fieldValue(f, values.value);
  const next = pageStep(event, v, f);
  if (next != null && next !== v) setField(f.key, next);
}
function reset() {
  if (props.fields.some((f) => fieldValue(f, values.value) !== f.value)) setValues(Object.fromEntries(props.fields.map((f) => [f.key, f.value])));
  if (layout.value !== initial.layout) setLayout(initial.layout);
  if (type.value !== initial.type) setType(initial.type);
  emit("reset");
  focusAfterReset(root.value);
}
</script>

<template>
  <div ref="root" v-bind="attrs" data-slot="fine-tune-card" :class="r.base({ class: attrs.class as string | undefined })">
    <div data-slot="fine-tune-card-header" :class="r.header()">
      <span data-slot="fine-tune-card-title" :class="r.title()" :title="text.title">{{ text.title }}</span>
      <div data-slot="fine-tune-card-state" :class="r.state()">
        <span data-slot="fine-tune-card-hint" :class="r.hint({ changed: isChanged })"><span data-slot="fine-tune-card-hint-icon" :class="r.hintIcon()" aria-hidden="true"><PhSparkle data-slot="icon" weight="fill" /></span><Shimmer data-fine-tune-card="hint-text" :class="r.hintText()" speed="fast" tone="accent">{{ text.adjust }}</Shimmer></span>
        <span data-slot="fine-tune-card-edited" :class="r.edited({ changed: isChanged })">
          <span data-slot="fine-tune-card-edited-text" :class="r.editedText()"><PhCheck data-slot="icon" weight="bold" aria-hidden="true" />{{ text.edited }}</span>
          <Button data-fine-tune-card="reset" :class="r.reset()" variant="ghost" size="sm" @click="reset">
            <template #icon><PhArrowCounterClockwise data-slot="icon" weight="bold" /></template>
            {{ text.reset }}
          </Button>
        </span>
      </div>
      <span data-slot="fine-tune-card-status" :class="r.status()" role="status">{{ isChanged ? text.edited : "" }}</span>
    </div>
    <div data-slot="fine-tune-card-body" :class="r.body()">
      <span data-slot="fine-tune-card-section" :class="r.section()">{{ text.layout }}</span>
      <SegmentedControl
        data-fine-tune-card="layout"
        :class="r.layout()"
        size="xs"
        fill
        icons
        :aria-label="text.layout"
        :options="layoutOptions"
        :value="layout"
        @update:value="setLayout"
      >
        <template #icon="{ option }"><component :is="iconOf(option.value)" data-slot="icon" weight="bold" aria-hidden="true" /></template>
      </SegmentedControl>
      <div data-slot="fine-tune-card-fields" :class="r.fields()">
        <NumberInput.Root
          v-for="f in fields"
          :key="f.key"
          data-slot="fine-tune-card-field" :class="r.field({ changed: fieldValue(f, values) !== f.value })"
          :data-key="f.key"
          :model-value="String(fieldValue(f, values))"
          :min="f.min"
          :max="f.max"
          :step="f.step ?? 1"
          @value-change="(details) => onValue(f, details.valueAsNumber)"
        >
          <NumberInput.Scrubber data-slot="fine-tune-card-scrubber" :class="r.scrubber()">
            <NumberInput.Label data-slot="fine-tune-card-field-label" :class="r.fieldLabel()" :title="f.label">{{ f.label }}</NumberInput.Label>
          </NumberInput.Scrubber>
          <NumberInput.Input data-slot="fine-tune-card-input" :class="r.input()" @keydown="(event: KeyboardEvent) => onPage(event, f)" />
          <span v-if="f.suffix" data-slot="fine-tune-card-suffix" :class="r.suffix()">{{ f.suffix }}</span>
        </NumberInput.Root>
      </div>
    </div>
    <div data-slot="fine-tune-card-footer" :class="r.footer()">
      <span data-slot="fine-tune-card-footer-label" :class="r.footerLabel()" :title="text.type">{{ text.type }}</span>
      <Select data-fine-tune-card="type"
        :class="r.type()"
        size="sm"
        variant="subtle"
        :items="types"
        :value="type"
        :placeholder="text.placeholder"
        placement="top-end"
        :aria-label="text.type"
        @update:value="setType"
      />
    </div>
  </div>
</template>
