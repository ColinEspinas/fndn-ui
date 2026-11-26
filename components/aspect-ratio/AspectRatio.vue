<script setup lang="ts">
/** A box that keeps a width-to-height ratio. */
import { computed, useAttrs } from "vue";
import { aspectRatio } from "./aspect-ratio.recipe";

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Width divided by height: 16 / 9 (default), 1, 4 / 3, 0.75 … Not a positive number: 16 / 9. */
    ratio?: number;
  }>(),
  { ratio: 16 / 9 },
);
defineSlots<{ default?: () => unknown }>();
const value = computed(() => (Number.isFinite(props.ratio) && props.ratio > 0 ? props.ratio : 16 / 9));
const rest = computed(() => { const { class: _c, style: _s, ...other } = attrs; return other; });
</script>

<template>
  <div v-bind="rest" data-slot="aspect-ratio" :class="aspectRatio({ class: attrs.class as string | undefined })" :style="[{ '--fndn-aspect-ratio': value }, attrs.style as any]"><slot /></div>
</template>
