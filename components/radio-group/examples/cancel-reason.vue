<script setup lang="ts">
import { ref } from "vue";
import { RadioGroup } from "@fndn/vue";

/* rows: a list of answers under one highlight, with a free-text row for anything else */
const reasons = [
  { value: "price", label: "Too expensive for our team" },
  { value: "feature", label: "Missing a feature we need" },
  { value: "switching", label: "Moving to another tool" },
];

const value = ref<string | null>(null);
</script>

<template>
  <RadioGroup
    v-model:value="value"
    name="reason"
    label="Why are you cancelling the Team plan?"
    layout="row"
    :items="reasons"
    customPlaceholder="Something else…"
    customLabel="Another reason"
    customEnterKeyHint="send"
    class="w-80"
  />
</template>
