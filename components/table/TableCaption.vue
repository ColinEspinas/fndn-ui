<script setup lang="ts">
/** The table's name, under the rows (<caption>). Put it first inside <Table> (HTML wants the caption first). */
import { useAttrs } from "vue";
import { table } from "./table.recipe";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
</script>

<template>
  <caption v-bind="attrs" data-slot="table-caption" :class="table().caption({ class: attrs.class as string | undefined })"><slot /></caption>
</template>
