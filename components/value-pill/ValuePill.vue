<script setup lang="ts">
/** Inline value badge set off in prose. */
import { computed, useAttrs } from "vue";
import { valuePill } from "./value-pill.recipe";
export type ValuePillTone = "neutral" | "green" | "orange" | "red" | "accent";

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(defineProps<{ tone?: ValuePillTone }>(), { tone: "neutral" });
const cls = computed(() => valuePill({ tone: props.tone, class: attrs.class as string | undefined }));
</script>

<template>
  <span v-bind="attrs" data-slot="value-pill" :class="cls"><slot /></span>
</template>
