<script setup lang="ts">
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@fndn/vue";

const invoices = [
  { id: "INV-2026-0117", date: "Nov 1, 2026", amount: "$1,240.00" },
  { id: "INV-2026-0104", date: "Oct 1, 2026", amount: "$1,240.00" },
  { id: "INV-2026-0091", date: "Sep 1, 2026", amount: "$980.50" },
];
</script>

<template>
  <Table class="max-w-[440px]">
    <TableCaption>Invoices for Northwind, Team plan</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead>Invoice</TableHead>
        <TableHead>Date</TableHead>
        <TableHead numeric>Amount</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="invoice in invoices" :key="invoice.id">
        <TableCell>{{ invoice.id }}</TableCell>
        <TableCell>{{ invoice.date }}</TableCell>
        <TableCell numeric>{{ invoice.amount }}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
