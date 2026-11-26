<script setup lang="ts">
/** Card description part. */
import { useAttrs } from "vue";
import { card } from "./card.recipe";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
</script>

<template>
  <p v-bind="attrs" data-slot="card-description" :class="card().description({ class: attrs.class as string | undefined })"><slot /></p>
</template>
