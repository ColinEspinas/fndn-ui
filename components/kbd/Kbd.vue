<script setup lang="ts">
/** Keyboard hint: one or more keys. */
import { computed, useAttrs } from "vue";
import { kbd } from "./kbd.recipe";
export type KbdVariant = "boxed" | "plain";

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** The keys in order, e.g. ["⌘", "K"]. */
    keys: string[];
    variant?: KbdVariant;
  }>(),
  { keys: () => [], variant: "boxed" },
);
const r = computed(() => kbd({ variant: props.variant }));
</script>

<template>
  <kbd dir="ltr" v-bind="attrs" data-slot="kbd" :class="r.base({ class: attrs.class as string | undefined })"><kbd v-for="(key, i) in keys" :key="i" data-slot="kbd-key" :class="r.key()">{{ key }}</kbd></kbd>
</template>
