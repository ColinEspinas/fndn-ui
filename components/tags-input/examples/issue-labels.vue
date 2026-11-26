<script setup lang="ts">
import { ref } from "vue";
import { TagsInput } from "@fndn/vue";

/* an issue's labels in the outline look: neutral tags, the colour only in the dot, as the issue list shows them */
const tones = { bug: "red", regression: "orange", billing: "purple", webhooks: "cyan" } as const;
const labels = ref(["bug", "regression", "billing"]);
</script>

<template>
  <TagsInput v-model:value="labels" label="Labels" tag-variant="outline" tone="auto" :tones="tones" placeholder="Add a label" style="width: 320px" />
</template>
