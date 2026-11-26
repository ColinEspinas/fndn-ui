<script setup lang="ts">
import { EmptyState, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@fndn/vue";
</script>

<!-- a table with no rows: one cell across every column holds the block -->
<template>
  <Table class="max-w-[440px]" aria-label="Invoices">
    <TableHeader>
      <TableRow>
        <TableHead>Invoice</TableHead>
        <TableHead>Date</TableHead>
        <TableHead numeric>Amount</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell :colspan="3">
          <EmptyState size="block" icon="file" title="No invoices yet" hint="Your first invoice arrives on Dec 1, 2026." />
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
