<script setup lang="ts">
import { StatusPill, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@fndn/vue";

const deploys = [
  { id: "dpl_7f3a9c", branch: "main", status: "Ready", tone: "green", duration: "50s" },
  { id: "dpl_8b21e4", branch: "feat/usage-alerts", status: "Building", tone: "accent", duration: "1m 12s" },
  { id: "dpl_3c90af", branch: "fix/tax-rounding", status: "Failed", tone: "red", duration: "48s" },
] as const;
</script>

<template>
  <Table aria-label="Recent deploys of web-app">
    <TableHeader>
      <TableRow>
        <TableHead>Branch</TableHead>
        <TableHead>Status</TableHead>
        <TableHead numeric>Duration</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="deploy in deploys" :key="deploy.id">
        <TableCell>{{ deploy.branch }}</TableCell>
        <TableCell><StatusPill :tone="deploy.tone" size="sm">{{ deploy.status }}</StatusPill></TableCell>
        <TableCell numeric>{{ deploy.duration }}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
