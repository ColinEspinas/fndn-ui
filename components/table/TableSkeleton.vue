<script setup lang="ts">
/** A placeholder bar for a loading row (the data form draws them itself). */
import { useAttrs } from "vue";
import { table } from "./table.recipe";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
withDefaults(defineProps<{ /** In a number column: at the end. */ numeric?: boolean }>(), { numeric: false });
</script>

<template>
  <span v-bind="attrs" data-slot="table-skeleton" :class="table({ numeric }).skeleton({ class: attrs.class as string | undefined })" aria-hidden="true" />
</template>
