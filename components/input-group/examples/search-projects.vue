<script setup lang="ts">
import { ref } from "vue";
import { PhMagnifyingGlass } from "@phosphor-icons/vue";
import { InputGroup } from "@fndn/vue";

const query = ref("");
</script>

<!-- an icon addon is decoration: hidden from assistive technology, the input keeps its name -->
<template>
  <InputGroup v-model:value="query" type="search" placeholder="Search projects" aria-label="Search projects" class="w-full max-w-80">
    <template #start><PhMagnifyingGlass weight="bold" aria-hidden="true" /></template>
  </InputGroup>
</template>
