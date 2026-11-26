<script setup lang="ts">
import { Search, type SearchItem } from "@fndn/vue";

/* one list for everything: the meta says what kind of result a row is */
const items: SearchItem[] = [
  { value: "project:web-app", label: "web-app", meta: "Project" },
  { value: "person:priya", label: "Priya Raman", meta: "Member" },
  { value: "action:new-project", label: "Create a project", meta: "Action" },
  { value: "project:billing-api", label: "billing-api", meta: "Project" },
  { value: "person:daniel", label: "Daniel Okafor", meta: "Member" },
  { value: "project:data-pipeline", label: "data-pipeline", meta: "Project" },
  { value: "action:invite", label: "Invite teammates", meta: "Action" },
  { value: "action:api-key", label: "Create an API key", meta: "Action" },
];
</script>

<template>
  <Search
    class="w-80"
    :items="items"
    :limit="3"
    label="Search Northwind"
    placeholder="Search projects, people and actions…"
  />
</template>
