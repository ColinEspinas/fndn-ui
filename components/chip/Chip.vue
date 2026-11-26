<script setup lang="ts">
/** Monospace token chip for code values. */
import { computed, useAttrs } from "vue";
import { chip } from "./chip.recipe";
export type ChipTone = "neutral" | "accent" | "green" | "orange" | "red";

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(defineProps<{ tone?: ChipTone }>(), { tone: "neutral" });

const cls = computed(() => chip({ tone: props.tone, class: attrs.class as string | undefined }));
</script>

<template>
  <code v-bind="attrs" data-slot="chip" :class="cls"><slot /></code>
</template>
