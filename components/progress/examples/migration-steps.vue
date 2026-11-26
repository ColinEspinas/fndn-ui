<script setup lang="ts">
import { Progress } from "@fndn/vue";
</script>

<template>
  <Progress class="w-full max-w-sm" :value="3" :max="8" label="Migrating the billing-api database" show-value value-text="3 of 8 tables" size="sm" />
</template>
