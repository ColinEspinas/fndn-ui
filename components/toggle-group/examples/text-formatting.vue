<script setup lang="ts">
import { ref } from "vue";
import { PhTextB, PhTextItalic, PhTextUnderline } from "@phosphor-icons/vue";
import { ToggleGroup } from "@fndn/vue";

/* several at once: bold, italic and underline apply together */
const styles = [
  { value: "bold", label: "Bold", icon: PhTextB },
  { value: "italic", label: "Italic", icon: PhTextItalic },
  { value: "underline", label: "Underline", icon: PhTextUnderline },
];

const format = ref<string[]>(["bold"]);
</script>

<template>
  <div class="flex w-80 flex-col gap-3">
    <ToggleGroup v-model:value="format" aria-label="Text style" multiple size="sm" :items="styles" />
    <p
      class="text-sm text-ink-2"
      :style="{
        fontWeight: format.includes('bold') ? 600 : undefined,
        fontStyle: format.includes('italic') ? 'italic' : undefined,
        textDecoration: format.includes('underline') ? 'underline' : undefined,
      }"
    >
      Webhook deliveries now retry for up to 24 hours.
    </p>
  </div>
</template>
