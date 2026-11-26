<script setup lang="ts">
/** Shimmering label — the agent is processing. */
import { computed, useAttrs } from "vue";
import { shimmer } from "./shimmer.recipe";

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(defineProps<{ speed?: "normal" | "fast"; tone?: "ink" | "accent" }>(), { speed: "normal", tone: "ink" });
const cls = computed(() => shimmer({ speed: props.speed, tone: props.tone, class: attrs.class as string | undefined }));
</script>

<template>
  <span v-bind="attrs" data-slot="shimmer" :class="cls"><slot /></span>
</template>
