<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { progressRing } from "./progress-ring.recipe";
/** Small progress ring with content in the center. */
export type ProgressRingTone = "orange" | "green" | "red" | "accent";
export type ProgressRingSize = "sm" | "md";

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** 0..1. Out-of-range and non-finite values are clamped. */
    progress: number;
    tone?: ProgressRingTone;
    size?: ProgressRingSize;
    /** Accessible name of the progress bar. */
    label?: string;
  }>(),
  { tone: "orange", size: "md", label: "Progress" },
);
const c = computed(() => progressRing({ size: props.size, tone: props.tone }));
const px = computed(() => (props.size === "sm" ? 24 : 28));
const r = computed(() => (px.value - 2) / 2);
const value = computed(() => (Number.isFinite(props.progress) ? Math.min(1, Math.max(0, props.progress)) : 0));
const slots = defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <span
    v-bind="attrs"
    role="progressbar"
    data-slot="progress-ring"
    :class="c.base({ class: attrs.class as string | undefined })"
    :aria-label="label"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="Math.round(value * 100)"
    :style="{ '--fndn-progress': value }"
  >
    <svg data-slot="progress-ring-svg" :class="c.svg()" :viewBox="`0 0 ${px} ${px}`" aria-hidden="true">
      <circle data-slot="progress-ring-track" :class="c.track()" :cx="px / 2" :cy="px / 2" :r="r" pathLength="100" />
      <circle data-slot="progress-ring-bar" :class="c.bar()" :cx="px / 2" :cy="px / 2" :r="r" pathLength="100" />
    </svg>
    <span v-if="slots.default" data-slot="progress-ring-label" :class="c.label()"><slot /></span>
  </span>
</template>
