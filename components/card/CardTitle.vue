<script setup lang="ts">
/** Card title part. */
import { useAttrs } from "vue";
import { card } from "./card.recipe";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
</script>

<template>
  <h3 v-bind="attrs" data-slot="card-title" :class="card().title({ class: attrs.class as string | undefined })"><slot /></h3>
</template>
