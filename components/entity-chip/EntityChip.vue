<script setup lang="ts">
/** Monogram + name in a soft field pill. */
import { computed, useAttrs } from "vue";
import Avatar from "../avatar/Avatar.vue";
import { entityChip } from "./entity-chip.recipe";

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const r = entityChip();

const props = defineProps<{
  name: string;
  /** Any CSS color for the monogram (our avatar); defaults to the orange token. */
  color?: string;
  /** Glyph in the disc; defaults to the first character of name. */
  monogram?: string;
}>();

/** First grapheme of a name, upper-cased: "jo" → "J", "🚀 Launch" → "🚀", "élan" → "É". */
function initial(name: string): string {
  const text = name.trim();
  if (!text) return "";
  const first =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)[Symbol.iterator]().next().value?.segment
      : Array.from(text)[0];
  return (first ?? "").toLocaleUpperCase();
}
const glyph = computed(() => props.monogram ?? initial(props.name));
</script>

<template>
  <span v-bind="attrs" data-slot="entity-chip" :class="r.base({ class: attrs.class as string | undefined })" :title="name">
    <Avatar :initials="glyph" :size="16" shape="round" :color="color" />
    <span data-slot="entity-chip-name" :class="r.name()">{{ name }}</span>
  </span>
</template>
