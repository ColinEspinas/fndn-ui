<script setup lang="ts">
/** Pick a number, or a range, on a track. Behaviour by Ark UI (Zag slider). */
import { Slider as ArkSlider } from "@ark-ui/vue/slider";
import { computed, onMounted, useAttrs, useId } from "vue";
import { trackModality } from "../lib/modality";
import { slider } from "./slider.recipe";

export type SliderSize = "sm" | "md";

/* the caller's class goes through the recipe; other attributes (id, data-*) go to the root */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    min?: number;
    max?: number;
    step?: number;
    /** A range: how many steps the two thumbs keep between them. */
    minStepsBetweenThumbs?: number;
    /** md: 24px control, 20px thumb (default). sm: 18px control, 14px thumb. */
    size?: SliderSize;
    /** Visible label, above at the start; names the thumbs. */
    label?: string;
    /** Show the value at the end of the label row. */
    showValue?: boolean;
    /** Formats each value, for the text shown and the text announced (aria-valuetext). */
    formatValue?: (value: number) => string;
    /** Names of the thumbs of a range, one per thumb. */
    thumbLabels?: string[];
    /** Form field name (the hidden inputs). */
    name?: string;
    disabled?: boolean;
    ariaLabel?: string;
  }>(),
  { min: 0, max: 100, step: 1, size: "md", showValue: false, disabled: false },
);

/** v-model:value — one number per thumb ([40], or [20, 80] for a range); falls back to local state
 * (one thumb in the middle) when unbound. Updates while dragging and on every key. */
const value = defineModel<number[]>("value");
const emit = defineEmits<{ valueChange: [value: number[]]; valueChangeEnd: [value: number[]] }>();

const r = computed(() => slider({ size: props.size }));
/* the engine needs as many values as thumbs: the default is one thumb in the middle */
const current = computed(() => value.value ?? [props.min + (props.max - props.min) / 2]);
const uid = useId();
const thumbId = (index: number) => `${uid}-thumb-${index}`;
/* a thumb with a name of its own (thumbLabels, or aria-label without a visible label) is named by
 * it alone: it labels itself, which reads its aria-label, instead of the shared label */
const own = computed(() => props.thumbLabels ?? (!props.label && props.ariaLabel != null ? current.value.map(() => props.ariaLabel as string) : undefined));
const format = (v: number) => (props.formatValue ? props.formatValue(v) : String(v));
const valueText = computed(() => (props.formatValue ? ({ value: v }: { value: number }) => props.formatValue!(v) : undefined));

function onValue(next: number[]) {
  value.value = next;
  emit("valueChange", next);
}

onMounted(() => trackModality());
</script>

<template>
  <ArkSlider.Root
    v-bind="attrs"
    data-slot="slider"
    :class="r.base({ class: attrs.class as string | undefined })"
    :model-value="current"
    :min="min"
    :max="max"
    :step="step"
    :min-steps-between-thumbs="minStepsBetweenThumbs"
    :name="name"
    :disabled="disabled"
    :ids="{ thumb: thumbId }"
    :aria-label="own ?? (ariaLabel != null ? [ariaLabel] : undefined)"
    :aria-labelledby="own?.map((_, index) => thumbId(index))"
    :get-aria-value-text="valueText"
    @update:model-value="onValue"
    @value-change-end="(d) => emit('valueChangeEnd', d.value)"
  >
    <ArkSlider.Label v-if="label" data-slot="slider-label" :class="r.label()">{{ label }}</ArkSlider.Label>
    <ArkSlider.ValueText v-if="showValue" data-slot="slider-value-text" :class="r.valueText()">{{ current.map(format).join(" – ") }}</ArkSlider.ValueText>
    <ArkSlider.Control data-slot="slider-control" :class="r.control()">
      <ArkSlider.Track data-slot="slider-track" :class="r.track()">
        <ArkSlider.Range data-slot="slider-range" :class="r.range()" />
      </ArkSlider.Track>
      <ArkSlider.Thumb v-for="(_, index) in current" :key="index" :index="index" data-slot="slider-thumb" :class="r.thumb()">
        <ArkSlider.HiddenInput data-slot="slider-hidden-input" />
      </ArkSlider.Thumb>
    </ArkSlider.Control>
  </ArkSlider.Root>
</template>
