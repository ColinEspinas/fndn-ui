<script setup lang="ts">
import { ref } from "vue";
import { Listbox } from "@fndn/vue";

/* every option stays in view; meta on the right, a disabled option says why */
const regions = [
  { value: "iad1", label: "Washington, D.C. (iad1)", meta: "18 ms" },
  { value: "fra1", label: "Frankfurt (fra1)", meta: "96 ms" },
  { value: "gru1", label: "São Paulo (gru1)", meta: "Business plan", disabled: true },
];

const region = ref(["iad1"]);
</script>

<template>
  <Listbox :items="regions" v-model:value="region" label="Region" style="width: 280px" />
</template>
