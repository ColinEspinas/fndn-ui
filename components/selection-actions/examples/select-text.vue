<script setup lang="ts">
import { ref } from "vue";
import { SelectionActions } from "@fndn/vue";

const actions = [
  { value: "explain", label: "Explain", icon: "question" },
  {
    value: "improve",
    label: "Improve",
    icon: "sparkle",
    busyLabel: "Improving",
  },
  {
    value: "shorten",
    label: "Shorten",
    icon: "corners-in",
    busyLabel: "Shortening",
  },
  {
    value: "tone",
    label: "Tone",
    icon: "chat-text",
    busyLabel: "Changing tone",
  },
];

const text = ref("Thanks for flagging this, and sorry for the confusion on Monday. Reminders scheduled before 6 a.m. were going out an hour late after the daylight saving change, and we shipped a fix this morning.");
</script>

<template>
  <SelectionActions
    v-model:text="text"
    :actions="actions"
    style="width: 420px"
  />
</template>
