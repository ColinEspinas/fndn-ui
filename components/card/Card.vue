<script setup lang="ts">
/** White surface on the hairline ring. */
import { computed, useAttrs } from "vue";
import { card } from "./card.recipe";
export type CardElevation = "hairline" | "card" | "raised" | "overlay";

/* the caller's class goes through the recipe */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const props = withDefaults(defineProps<{ elevation?: CardElevation; inset?: boolean }>(), { elevation: "card", inset: false });
const r = computed(() => card({ elevation: props.elevation, inset: props.inset }));
</script>

<template>
  <div v-bind="attrs" data-slot="card" :class="r.base({ class: attrs.class as string | undefined })"><slot /></div>
</template>
