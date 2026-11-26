<script setup lang="ts">
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tag } from "@fndn/vue";

const pulls = [
  { id: "#482", title: "Add retry to webhook delivery", labels: [{ name: "backend", tone: "blue" }, { name: "needs review", tone: "yellow" }] },
  { id: "#479", title: "Update pricing page copy", labels: [{ name: "docs", tone: "cyan" }] },
  { id: "#476", title: "Fix flaky upload test", labels: [{ name: "tests", tone: "purple" }] },
] as const;
</script>

<!-- sm tags in a dense table -->
<template>
  <Table aria-label="Open pull requests" class="w-[440px] max-w-full">
    <TableHeader>
      <TableRow>
        <TableHead>Pull request</TableHead>
        <TableHead>Labels</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="pull in pulls" :key="pull.id">
        <TableCell>{{ pull.id }} {{ pull.title }}</TableCell>
        <TableCell>
          <div class="flex flex-wrap gap-1">
            <Tag v-for="label in pull.labels" :key="label.name" :tone="label.tone" size="sm">{{ label.name }}</Tag>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
