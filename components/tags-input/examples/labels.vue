<script setup lang="ts">
import { ref } from "vue";
import { TagsInput } from "@fndn/vue";

/* each label keeps its colour; a new label gets one from its word (tone "auto") */
const tones = { bug: "red", billing: "purple", webhooks: "cyan" } as const;
const labels = ref(["bug", "billing", "webhooks"]);
</script>

<template>
  <TagsInput v-model:value="labels" label="Labels" tone="auto" :tones="tones" placeholder="Add a label" style="width: 320px" />
</template>
