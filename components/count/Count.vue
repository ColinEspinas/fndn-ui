<script setup lang="ts">
/** Number badge with tabular numbers. */
import { computed, useAttrs } from "vue";
import { count } from "./count.recipe";
export type CountVariant = "plain" | "boxed";

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    variant?: CountVariant;
    /** md (default): plain in the surrounding size, boxed 20px. sm: plain 12px, boxed 18px. */
    size?: "sm" | "md";
    /** Selected look; automatic inside a selected chip, tab or segment. */
    selected?: boolean;
  }>(),
  { variant: "plain", size: "md", selected: false },
);
const cls = computed(() => count({ variant: props.variant, size: props.size, selected: props.selected, class: attrs.class as string | undefined }));
</script>

<template>
  <span v-bind="attrs" data-slot="count" :class="cls"><slot /></span>
</template>
