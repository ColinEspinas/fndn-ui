<script setup lang="ts">
/** Hairline ring with a single ink arc. */
import { computed, useAttrs } from "vue";
import { spinner } from "./spinner.recipe";
export type SpinnerSize = "sm" | "md" | "lg";

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    size?: SpinnerSize;
    label?: string;
    /** Purely visual, inside something that is already a status region: aria-hidden, no role or label. */
    decorative?: boolean;
  }>(),
  { size: "sm", label: "Loading", decorative: false },
);
const cls = computed(() => spinner({ size: props.size, class: attrs.class as string | undefined }));
</script>

<template>
  <span v-if="decorative" v-bind="attrs" data-slot="spinner" :class="cls" aria-hidden="true" />
  <span v-else v-bind="attrs" role="status" data-slot="spinner" :class="cls" :aria-label="label" />
</template>
