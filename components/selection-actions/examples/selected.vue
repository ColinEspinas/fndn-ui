<script setup lang="ts">
import { ref } from "vue";
import { SelectionActions } from "@fndn/vue";

const actions = [
  { value: "explain", label: "Explain", icon: "question" as const },
  {
    value: "improve",
    label: "Improve",
    icon: "sparkle" as const,
    busyLabel: "Improving",
  },
  {
    value: "shorten",
    label: "Shorten",
    icon: "corners-in" as const,
    busyLabel: "Shortening",
  },
  {
    value: "tone",
    label: "Tone",
    icon: "chat-text" as const,
    busyLabel: "Changing tone",
  },
];

const text = ref("Thanks for flagging this, and sorry for the confusion on Monday. Reminders scheduled before 6 a.m. were going out an hour late after the daylight saving change, and we shipped a fix this morning.");

const selection = ref({ start: 65, end: 195 });

const open = ref(true);
</script>

<template>
  <SelectionActions
    v-model:text="text"
    v-model:selection="selection"
    v-model:open="open"
    :actions="actions"
    style="width: 420px"
  />
</template>
