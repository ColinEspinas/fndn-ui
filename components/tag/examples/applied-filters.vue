<script setup lang="ts">
import { ref } from "vue";
import { Button, Tag } from "@fndn/vue";

const initial = ["Status: Failed", "Branch: main", "Project: billing-api"];
const filters = ref(initial);
</script>

<template>
  <div class="flex w-80 flex-wrap items-center gap-1.5 text-sm">
    <Tag v-for="filter in filters" :key="filter" removable :removeLabel="`Remove ${filter}`" @remove="filters = filters.filter((f) => f !== filter)">
      {{ filter }}
    </Tag>
    <Button v-if="filters.length" size="xs" variant="ghost" @click="filters = []">Clear all</Button>
    <Button v-else size="xs" variant="ghost" @click="filters = initial">Restore filters</Button>
  </div>
</template>
