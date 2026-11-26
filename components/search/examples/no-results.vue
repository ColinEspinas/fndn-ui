<script setup lang="ts">
import { ref } from "vue";
import { Search } from "@fndn/vue";

const items = ["web-app", "billing-api", "mobile", "docs-site", "data-pipeline"];
const query = ref("kubernetes");
</script>

<template>
  <Search
    v-model:query="query"
    class="w-80"
    :items="items"
    label="Search projects"
    placeholder="Search projects…"
    emptyTitle="No projects match"
    emptyHint="Search by project name, like web-app"
  />
</template>
