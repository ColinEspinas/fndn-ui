<script setup lang="ts">
import { PhMagnifyingGlass } from "@phosphor-icons/vue";
import { InputGroup, Kbd } from "@fndn/vue";
</script>

<!-- the top bar's search: the Kbd addon tells the shortcut that focuses it from anywhere -->
<template>
  <InputGroup placeholder="Search or jump to…" aria-label="Search Northwind" aria-keyshortcuts="Meta+K" class="w-full max-w-72">
    <template #start><PhMagnifyingGlass weight="bold" aria-hidden="true" /></template>
    <template #end><Kbd :keys="['⌘', 'K']" /></template>
  </InputGroup>
</template>
