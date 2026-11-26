<script setup lang="ts">
/** Pick exactly one of a short list. Behaviour by Ark UI (Zag radio-group). */
import { RadioGroup as ArkRadioGroup } from "@ark-ui/vue/radio-group";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import { glide } from "../lib/glide";
import { radioGroup } from "./radio-group.recipe";
import { trackModality } from "../lib/modality";

export type RadioGroupItem = { value: string; label?: string; disabled?: boolean };

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Options in order. Strings are accepted as value = label. */
    items: ReadonlyArray<RadioGroupItem | string>;
    /** Visible group label. Without one, pass ariaLabel. */
    label?: string;
    ariaLabel?: string;
    /** vertical: stacked options (default). horizontal: options in a row that wraps. */
    orientation?: "vertical" | "horizontal";
    /** inline: each control with its label (default). row: a list of option rows under one gliding highlight. */
    layout?: "inline" | "row";
    /** Row layout: adds a free-text row after the options with this placeholder (e.g. "Something else…"). */
    customPlaceholder?: string;
    /** Accessible name of the free-text field; defaults to the placeholder. */
    customLabel?: string;
    /** enterkeyhint of the free-text field ("next" when another step follows, "done", "send"…). */
    customEnterKeyHint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
    disabled?: boolean;
    /** Form field name of the radios. */
    name?: string;
  }>(),
  { orientation: "vertical", layout: "inline", disabled: false },
);

/** v-model:value — falls back to local state when unbound. */
const value = defineModel<string | null>("value", { default: null });
/** v-model:custom — text of the free-text row. Typing makes the value null; picking an option empties it. */
const custom = defineModel<string>("custom", { default: "" });
const emit = defineEmits<{ valueChange: [value: string | null]; customChange: [text: string] }>();
defineSlots<{ label?: () => unknown }>();

const opts = computed(() => props.items.map((o) => (typeof o === "string" ? { value: o, label: o } : { label: o.value, ...o })));
const row = computed(() => props.layout === "row");
const r = computed(() => radioGroup({ orientation: props.orientation, layout: row.value ? "row" : "inline" }));

function onValue(next: string | null) {
  value.value = next;
  emit("valueChange", next);
  /* picking an option replaces a free-text answer */
  if (next != null && custom.value) { custom.value = ""; emit("customChange", ""); }
}
function onCustom(event: Event) {
  const next = (event.target as HTMLInputElement).value;
  custom.value = next;
  emit("customChange", next);
  /* a free-text answer replaces the selection */
  if (next && value.value != null) { value.value = null; emit("valueChange", null); }
}

/* Home / End are not part of the native radio keys (the free-text field keeps them) */
function homeEnd(event: KeyboardEvent) {
  if (event.defaultPrevented || (event.key !== "Home" && event.key !== "End")) return;
  if (!(event.target as Element).matches?.('input[type="radio"]')) return;
  const inputs = Array.from((event.currentTarget as HTMLElement).querySelectorAll<HTMLInputElement>('input[type="radio"]:not(:disabled)'));
  const target = inputs[event.key === "Home" ? 0 : inputs.length - 1];
  if (!target) return;
  event.preventDefault();
  target.focus();
  target.click();
}

const root = ref<{ $el?: HTMLElement } | HTMLElement | null>(null);
const layer = ref<HTMLElement | null>(null);
let stopGlide: (() => void) | undefined;
const rootEl = () => (root.value instanceof HTMLElement ? root.value : (root.value?.$el ?? null));
const wire = () => {
  stopGlide?.();
  stopGlide = undefined;
  const el = rootEl();
  if (row.value && el && layer.value) stopGlide = glide(el, layer.value, { rows: "[data-slot=radio-group-item], [data-slot=radio-group-custom]", follow: "hover" });
};
onMounted(() => { trackModality(); wire(); });
watch(row, () => requestAnimationFrame(wire));
onBeforeUnmount(() => stopGlide?.());
</script>

<template>
  <ArkRadioGroup.Root
    v-bind="attrs"
    ref="root"
    data-slot="radio-group" :class="r.base({ class: attrs.class as string | undefined })"
    :aria-label="ariaLabel"
    :orientation="orientation"
    :model-value="value"
    :disabled="disabled"
    :name="name"
    @update:model-value="onValue"
    @keydown="homeEnd"
  >
    <ArkRadioGroup.Label v-if="label || $slots.label" data-slot="radio-group-label" :class="r.label()"><slot name="label">{{ label }}</slot></ArkRadioGroup.Label>
    <span v-if="row" ref="layer" data-slot="radio-group-highlight" :class="r.highlight()" aria-hidden="true" />
    <ArkRadioGroup.Item v-for="o in opts" :key="o.value" :value="o.value" :disabled="o.disabled" data-slot="radio-group-item" :class="r.item()">
      <ArkRadioGroup.ItemControl data-slot="radio-group-control" :class="r.control()" />
      <ArkRadioGroup.ItemText data-slot="radio-group-item-text" :class="r.itemText()">{{ o.label }}</ArkRadioGroup.ItemText>
      <ArkRadioGroup.ItemHiddenInput data-slot="radio-group-input" :class="r.input()" />
    </ArkRadioGroup.Item>
    <label v-if="row && customPlaceholder != null" data-slot="radio-group-custom" :class="r.custom()">
      <input
        data-slot="radio-group-custom-input" :class="r.customInput()"
        dir="auto"
        type="text"
        :placeholder="customPlaceholder"
        :aria-label="customLabel ?? customPlaceholder"
        :enterkeyhint="customEnterKeyHint"
        :value="custom"
        :disabled="disabled || undefined"
        @input="onCustom"
      />
    </label>
  </ArkRadioGroup.Root>
</template>
