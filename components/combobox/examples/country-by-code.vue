<script setup lang="ts">
import { ref } from "vue";
import { PhGlobe } from "@phosphor-icons/vue";
import { Combobox } from "@fndn/vue";

/* keywords find an option without being shown: "jpn", "tokyo" or "nippon" all find Japan */
const countries = [
  { value: "DE", label: "Germany", meta: "DE", keywords: ["DEU", "Deutschland", "Berlin", "Munich", "Frankfurt"] },
  { value: "JP", label: "Japan", meta: "JP", keywords: ["JPN", "Nippon", "Tokyo", "Osaka"] },
  { value: "GB", label: "United Kingdom", meta: "GB", keywords: ["GBR", "UK", "Britain", "England", "London"] },
  { value: "US", label: "United States", meta: "US", keywords: ["USA", "America", "New York", "San Francisco"] },
  { value: "BR", label: "Brazil", meta: "BR", keywords: ["BRA", "Brasil", "São Paulo", "Sao Paulo", "Rio de Janeiro"] },
  { value: "IN", label: "India", meta: "IN", keywords: ["IND", "Bharat", "Bengaluru", "Mumbai"] },
  { value: "NL", label: "Netherlands", meta: "NL", keywords: ["NLD", "Holland", "Nederland", "Amsterdam"] },
  { value: "CH", label: "Switzerland", meta: "CH", keywords: ["CHE", "Schweiz", "Suisse", "Zurich", "Geneva"] },
];

const country = ref<string | null>("DE");
</script>

<template>
  <Combobox
    :items="countries"
    v-model:value="country"
    label="Company country"
    placeholder="Country, code or city"
    empty-text="No country matches"
    style="width: 260px"
  >
    <template #start><PhGlobe data-slot="icon" weight="bold" /></template>
  </Combobox>
</template>
