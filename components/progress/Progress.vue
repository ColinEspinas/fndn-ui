<script setup lang="ts">
/** A linear progress bar. Behaviour by Ark UI (Zag progress). */
import { Progress as ArkProgress } from "@ark-ui/vue/progress";
import { computed, useAttrs, useId } from "vue";
import { progress } from "./progress.recipe";

export type ProgressTone = "orange" | "green" | "red" | "accent";
export type ProgressSize = "sm" | "md";

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Between min and max (clamped). null or omitted: indeterminate. */
    value?: number | null;
    min?: number;
    max?: number;
    /** Shown above the track at the start; names the progress bar. */
    label?: string;
    /** The progress bar's name when there is no visible label. */
    ariaLabel?: string;
    /** Shows the value above the track at the end ("42%"). */
    showValue?: boolean;
    /** Text shown as the value instead of the percentage ("3 of 8 files"); also aria-valuetext. */
    valueText?: string;
    tone?: ProgressTone;
    /** The track's height: sm 4px, md 6px. */
    size?: ProgressSize;
  }>(),
  { value: null, min: 0, max: 100, label: undefined, ariaLabel: "Progress", showValue: false, valueText: undefined, tone: "orange", size: "md" },
);

const labelId = `${useId()}label`;
const r = computed(() => progress({ tone: props.tone, size: props.size }));
const lo = computed(() => (Number.isFinite(props.min) ? props.min : 0));
const hi = computed(() => (Number.isFinite(props.max) && props.max > lo.value ? props.max : lo.value + 100));
/* omitted or not a number: indeterminate (Ark's own default would be 50) */
const v = computed(() => (props.value == null || !Number.isFinite(props.value) ? null : Math.min(hi.value, Math.max(lo.value, props.value))));
const hasLabel = computed(() => props.label != null && props.label !== "");
/* only the attributes that are set: an undefined one would remove Ark's own (React and Svelte
 * keep Ark's aria-label beside aria-labelledby, which wins) */
const trackAria = computed(() => ({
  ...(hasLabel.value ? { "aria-labelledby": labelId } : { "aria-label": props.ariaLabel }),
  ...(props.valueText != null ? { "aria-valuetext": props.valueText } : {}),
}));
</script>

<template>
  <ArkProgress.Root v-bind="attrs" data-slot="progress" :class="r.base({ class: attrs.class as string | undefined })" :model-value="v" :min="lo" :max="hi" :ids="{ label: labelId }">
    <ArkProgress.Label v-if="hasLabel" data-slot="progress-label" :class="r.label()">{{ label }}</ArkProgress.Label>
    <ArkProgress.ValueText v-if="showValue && v != null" data-slot="progress-value" :class="r.value()" aria-hidden="true">
      <template v-if="valueText" #default>{{ valueText }}</template>
    </ArkProgress.ValueText>
    <ArkProgress.Track
      data-slot="progress-track"
      :class="r.track()"
      v-bind="trackAria"
    >
      <ArkProgress.Range data-slot="progress-range" :class="r.range()" />
    </ArkProgress.Track>
  </ArkProgress.Root>
</template>
