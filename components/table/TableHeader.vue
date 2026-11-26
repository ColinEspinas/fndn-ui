<script setup lang="ts">
/** Table header part (<thead>). */
import { useAttrs } from "vue";
import { table } from "./table.recipe";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
</script>

<template>
  <thead v-bind="attrs" data-slot="table-header" :class="table().header({ class: attrs.class as string | undefined }) || undefined"><slot /></thead>
</template>
