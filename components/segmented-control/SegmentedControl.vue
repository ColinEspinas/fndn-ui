<script setup lang="ts">
/** Pick one of a few options side by side. A radio group, by Ark UI (Zag radio-group). */
import { SegmentGroup } from "@ark-ui/vue/segment-group";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs } from "vue";
import { trackModality } from "../lib/modality";
import { scrollSelected } from "./segmented-control.logic";
import Count from "../count/Count.vue";
import { segmentedControl } from "./segmented-control.recipe";

export type SegmentedOption = {
  value: string;
  /** Text of the segment. With `icons` it is not shown but stays the accessible name. */
  label?: string;
  disabled?: boolean;
  /** Status dot inside the label: a tag hue, or true for a neutral (ink-3) dot. */
  dot?: SegmentedDotTone | true;
  /** Count inside the label, after the text (a plain Count). */
  count?: number | string;
};

export type SegmentedDotTone = "blue" | "green" | "orange" | "red" | "purple" | "cyan" | "yellow" | "pink";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Segments in order. Strings are accepted as value = label. */
    options: ReadonlyArray<string | SegmentedOption>;
    /** segments: on a field track (default). chips: separate 26px chips with a gap, for a filter row; size does not apply. */
    variant?: "segments" | "chips";
    /** sm: 24px compact switcher (default). md: 32px control. */
    size?: "xs" | "sm" | "md" | "lg";
    /** pill: fully round. rounded: a field's corners, for squarer chrome. Left out, the app's shape (a pill, or rounded in a rounded app: "shape": "rounded" in the project's fndn.json). */
    shape?: "pill" | "rounded";
    /** Equal-width segments that share the root's width. */
    fill?: boolean;
    /** Icon-only square segments; labels stay as accessible names. Render the icons with the `icon` slot. */
    icons?: boolean;
    disabled?: boolean;
    /** Form field name of the radios. */
    name?: string;
  }>(),
  { variant: "segments", size: "md", fill: false, icons: false, disabled: false },
);

/** v-model:value — falls back to local state when unbound; defaults to the first option. */
const value = defineModel<string>("value");
const emit = defineEmits<{ valueChange: [value: string] }>();
defineSlots<{ icon?: (props: { option: Required<Pick<SegmentedOption, "value" | "label">> & SegmentedOption }) => unknown }>();

const opts = computed(() => props.options.map((o) => (typeof o === "string" ? { value: o, label: o } : { label: o.value, ...o })));
const r = computed(() => segmentedControl({ variant: props.variant, size: props.size, shape: props.shape, fill: props.fill, icons: props.icons }));
const current = computed(() => value.value ?? opts.value.find((o) => !o.disabled)?.value ?? null);

function onValue(next: string | null) {
  if (next == null) return;
  value.value = next;
  emit("valueChange", next);
}

/* Home / End are not part of the native radio keys */
function homeEnd(event: KeyboardEvent) {
  if (event.defaultPrevented || (event.key !== "Home" && event.key !== "End")) return;
  const inputs = Array.from((event.currentTarget as HTMLElement).querySelectorAll<HTMLInputElement>('input[type="radio"]:not(:disabled)'));
  const target = event.key === "Home" ? inputs[0] : inputs[inputs.length - 1];
  if (!target) return;
  event.preventDefault();
  target.focus();
  target.click();
}

onMounted(() => trackModality());

/* labels are never cut: options that do not fit scroll sideways, the selected one kept in view (segmented-control.logic.ts) */
const root = ref<{ $el?: HTMLElement } | null>(null);
let stopScroll = () => {};
onMounted(() => { stopScroll = scrollSelected(root.value?.$el ?? null); });
onBeforeUnmount(() => stopScroll());
</script>

<template>
  <SegmentGroup.Root
    ref="root"
    v-bind="attrs"
    data-slot="segmented-control"
    :class="r.base({ class: attrs.class as string | undefined })"
    orientation="horizontal"
    :model-value="current"
    :disabled="disabled"
    :name="name"
    @update:model-value="onValue"
    @keydown="homeEnd"
  >
    <SegmentGroup.Indicator data-slot="segmented-control-thumb" :class="r.thumb()" />
    <SegmentGroup.Item v-for="o in opts" :key="o.value" :value="o.value" :disabled="o.disabled" data-slot="segmented-control-option" :class="r.option()">
      <slot name="icon" :option="o" />
      <SegmentGroup.ItemText data-slot="segmented-control-label" :class="r.label()"><span v-if="o.dot" data-slot="segmented-control-dot" :class="r.dot({ tone: o.dot === true ? 'none' : o.dot })" aria-hidden="true" />{{ o.label }}<template v-if="o.count != null">{{ " " }}<Count>{{ o.count }}</Count></template></SegmentGroup.ItemText>
      <SegmentGroup.ItemHiddenInput data-slot="segmented-control-input" :class="r.input()" />
    </SegmentGroup.Item>
  </SegmentGroup.Root>
</template>
