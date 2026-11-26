<script setup lang="ts">
import { ref } from "vue";
import { ThinkingState } from "@fndn/vue";

const expanded = ref(true);

const rows = [
  {
    primary: "PgBouncer configuration",
    secondary: "pgbouncer.org",
    href: "https://www.pgbouncer.org/config.html",
  },
  {
    primary: "Number of database connections",
    secondary: "wiki.postgresql.org",
    href: "https://wiki.postgresql.org/wiki/Number_Of_Database_Connections",
  },
  {
    primary: "Connections and authentication",
    secondary: "postgresql.org",
    href: "https://www.postgresql.org/docs/current/runtime-config-connection.html",
  },
];
</script>

<template>
  <ThinkingState
    variant="search"
    v-model:expanded="expanded"
    doneLabel="Searched the web"
    query="postgres too many connections with pgbouncer"
    more="+5 more"
    :rows="rows"
  />
</template>
