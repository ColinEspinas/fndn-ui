<script setup lang="ts">
/** Table cell part (<td>). */
import { useAttrs } from "vue";
import { table } from "./table.recipe";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
withDefaults(defineProps<{
  /** A number column: aligned to the end, tabular figures. */ numeric?: boolean;
  /** The column that gives way (a title): it takes the room left and cuts its text, with a title. */ truncate?: boolean;
}>(), { numeric: false, truncate: false });
</script>

<template>
  <td v-bind="attrs" data-slot="table-cell" :class="table({ numeric, truncate }).cell({ class: attrs.class as string | undefined })"><slot /></td>
</template>
