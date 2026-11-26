<script setup lang="ts">
/** Card body part. */
import { useAttrs } from "vue";
import { card } from "./card.recipe";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
</script>

<template>
  <div v-bind="attrs" data-slot="card-body" :class="card().body({ class: attrs.class as string | undefined })"><slot /></div>
</template>
