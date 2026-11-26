<script setup lang="ts">
/** Table body part (<tbody>). */
import { useAttrs } from "vue";
import { table } from "./table.recipe";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
</script>

<template>
  <tbody v-bind="attrs" data-slot="table-body" :class="table().body({ class: attrs.class as string | undefined }) || undefined"><slot /></tbody>
</template>
