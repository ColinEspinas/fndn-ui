<script lang="ts">
/** Formats elapsed milliseconds the way loading-state shows them: 7.9s · 1m 2.0s · 1h 12m */
export function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 100) / 10;
  if (total < 60) return `${total.toFixed(1)}s`;
  const minutes = Math.floor(total / 60);
  /* past an hour the tenths stop meaning anything: 1h 12m */
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes}m ${(total % 60).toFixed(1)}s`;
}
</script>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useAttrs } from "vue";
import { loadingState } from "./loading-state.recipe";
import Shimmer from "../shimmer/Shimmer.vue";
/** Pixel-grid loader with a shimmering label and elapsed timer. */
export type LoadingStateVariant = "drive" | "dots" | "orbit";

const props = withDefaults(
  defineProps<{ variant?: LoadingStateVariant; label?: string; /** Formatted elapsed time; ticks from mount when omitted. */ elapsed?: string; showElapsed?: boolean }>(),
  { variant: "drive", label: "Loading", elapsed: undefined, showElapsed: true },
);

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const r = computed(() => loadingState({ variant: props.variant }));

/* ticks from mount unless the host passes the time; the ticks are never announced */
const ticking = ref("0.0s");
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  if (props.elapsed !== undefined || !props.showElapsed) return;
  const start = Date.now();
  timer = setInterval(() => { ticking.value = formatElapsed(Date.now() - start); }, 100);
});
onUnmounted(() => { if (timer) clearInterval(timer); });
</script>

<template>
  <div v-bind="attrs" role="status" :aria-label="label" data-slot="loading-state" :class="r.base({ class: attrs.class as string | undefined })">
    <span data-slot="loading-state-grid" :class="r.grid()" aria-hidden="true"><span v-for="i in 9" :key="i" data-slot="loading-state-cell" :class="r.cell()" /></span>
    <Shimmer data-loading-state="label" speed="fast" :class="r.label()" :title="label">{{ label }}</Shimmer>
    <span v-if="showElapsed" data-slot="loading-state-elapsed" :class="r.elapsed()" aria-hidden="true">{{ props.elapsed ?? ticking }}</span>
  </div>
</template>
