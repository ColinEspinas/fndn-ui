<script setup lang="ts">
import { ref } from "vue";
import { SelectionActions } from "@fndn/vue";

const actions = [
  {
    value: "improve",
    label: "Improve",
    icon: "sparkle",
    busyLabel: "Improving",
  },
];

const text = ref("Thanks for flagging this, and sorry for the confusion on Monday. Reminders scheduled before 6 a.m. were going out an hour late after the daylight saving change, and we shipped a fix this morning.");

const selection = ref({ start: 65, end: 195 });

const open = ref(true);

const result = ref("Reminders set before 6 a.m. went out an hour late ");
</script>

<template>
  <SelectionActions
    v-model:text="text"
    v-model:selection="selection"
    v-model:open="open"
    busy
    busyLabel="Improving"
    v-model:result="result"
    :actions="actions"
    style="width: 420px"
  />
</template>
