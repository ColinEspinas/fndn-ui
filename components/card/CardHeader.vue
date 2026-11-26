<script setup lang="ts">
/** Card header part. */
import { useAttrs } from "vue";
import { card } from "./card.recipe";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
</script>

<template>
  <div v-bind="attrs" data-slot="card-header" :class="card().header({ class: attrs.class as string | undefined })"><slot /></div>
</template>
