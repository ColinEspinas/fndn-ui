<script setup lang="ts">
/** Table head cell part (<th>). */
import { useAttrs } from "vue";
import { table } from "./table.recipe";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
withDefaults(defineProps<{
  /** A number column: aligned to the end, tabular figures. */ numeric?: boolean;
  /** The column that gives way (a title): it takes the room left and cuts its text, with a title. */ truncate?: boolean;
  scope?: string;
}>(), { numeric: false, truncate: false, scope: "col" });
</script>

<template>
  <th v-bind="attrs" data-slot="table-head" :scope="scope" :class="table({ numeric, truncate }).head({ class: attrs.class as string | undefined })"><slot /></th>
</template>
