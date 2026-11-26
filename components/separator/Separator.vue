<script setup lang="ts">
/** A 1px rule that divides content, with an optional label in the middle. */
import { computed, useAttrs, useId, useSlots } from "vue";
import { separator } from "./separator.recipe";

export type SeparatorOrientation = "horizontal" | "vertical";

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** horizontal (default): 1px high, full width. vertical: 1px wide, as tall as its row. */
    orientation?: SeparatorOrientation;
    /** Purely visual: role="none", skipped by assistive technology. */
    decorative?: boolean;
  }>(),
  { orientation: "horizontal", decorative: false },
);
/** Default slot: the label in the middle. */
defineSlots<{ default?: () => unknown }>();

const slots = useSlots();
const labelId = useId();
const labelled = computed(() => !!slots.default);
const r = computed(() => separator({ orientation: props.orientation, labelled: labelled.value }));
/* a separator's children are presentational: a labelled one is named by its label */
const a11y = computed(() =>
  props.decorative
    ? { role: "none" }
    : { role: "separator", "aria-orientation": props.orientation, ...(labelled.value ? { "aria-labelledby": labelId } : {}) },
);
</script>

<template>
  <div data-slot="separator" v-bind="{ ...a11y, ...attrs }" :class="r.base({ class: attrs.class as string | undefined })">
    <span v-if="labelled" :id="labelId" data-slot="separator-label" :class="r.label()"><slot /></span>
  </div>
</template>
