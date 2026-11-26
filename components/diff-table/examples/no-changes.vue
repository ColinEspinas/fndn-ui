<script setup lang="ts">
import { DiffTable } from "@fndn/vue";

const columns: [string, string, string] = ["Plan", "Billing", "Price"];

const labels = { empty: "Prices already match the plan sheet" };
</script>

<template>
  <DiffTable title="Proposed price changes" :columns="columns" :rows="[]" :labels="labels" />
</template>
