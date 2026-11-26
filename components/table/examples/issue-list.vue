<script setup lang="ts">
import { Avatar, StatusPill, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@fndn/vue";

const issues = [
  { id: "NW-482", title: "Add retry to webhook delivery when the endpoint times out", status: "In review", tone: "accent", assignee: "PR", color: "var(--fndn-tag-purple)", updated: "2 min ago" },
  { id: "NW-479", title: "Usage alerts fire twice for the same threshold", status: "In progress", tone: "orange", assignee: "DO", color: "var(--fndn-tag-blue)", updated: "1 h ago" },
  { id: "NW-471", title: "Invoice PDF cuts the tax line", status: "Todo", tone: "neutral", assignee: "AT", color: "var(--fndn-tag-green)", updated: "Nov 14" },
] as const;
</script>

<!-- flush: an issue list inside a pane, one line per row; the title gives way, cut with a title -->
<template>
  <Table variant="flush" aria-label="Open issues in billing-api">
    <TableHeader>
      <TableRow>
        <TableHead>ID</TableHead>
        <TableHead truncate>Title</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Assignee</TableHead>
        <TableHead numeric>Updated</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="issue in issues" :key="issue.id">
        <TableCell class="font-mono text-xs text-ink-2">{{ issue.id }}</TableCell>
        <TableCell truncate>{{ issue.title }}</TableCell>
        <TableCell><StatusPill :tone="issue.tone" size="sm">{{ issue.status }}</StatusPill></TableCell>
        <TableCell><Avatar :initials="issue.assignee" :color="issue.color" size="20" /></TableCell>
        <TableCell numeric class="text-ink-2">{{ issue.updated }}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
