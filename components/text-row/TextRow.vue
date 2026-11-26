<script setup lang="ts">
/** Label-left / value-right row. */
import { useAttrs } from "vue";
import { textRow } from "./text-row.recipe";

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const r = textRow();

defineProps<{ label?: string; value?: string; meta?: string }>();
const slots = defineSlots<{ label?: () => unknown; value?: () => unknown; meta?: () => unknown }>();
</script>

<template>
  <div v-bind="attrs" data-slot="text-row" :class="r.base({ class: attrs.class as string | undefined })">
    <span data-slot="text-row-label" :class="r.label()"><slot name="label">{{ label }}</slot></span>
    <span data-slot="text-row-values" :class="r.values()">
      <span data-slot="text-row-value" :class="r.value()"><slot name="value">{{ value }}</slot></span>
      <span v-if="meta !== undefined || slots.meta" data-slot="text-row-meta" :class="r.meta()"><slot name="meta">{{ meta }}</slot></span>
    </span>
  </div>
</template>
