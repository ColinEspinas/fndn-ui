<script setup lang="ts">
/** Table row part (<tr>). */
import { useAttrs } from "vue";
import { table } from "./table.recipe";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
</script>

<template>
  <tr v-bind="attrs" data-slot="table-row" :class="table().row({ class: attrs.class as string | undefined })"><slot /></tr>
</template>
