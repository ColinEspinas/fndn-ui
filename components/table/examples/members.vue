<script setup lang="ts">
import { Table } from "@fndn/vue";

const columns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
];

const rows = [
  { name: "Maya Chen", email: "maya@northwind.example", role: "Owner" },
  { name: "Daniel Okafor", email: "daniel@northwind.example", role: "Admin" },
  { name: "Aleksandra Wiśniewska-Kowalczyk", email: "aleksandra.wisniewska@northwind.example", role: "Member" },
  { name: "Jo", email: "jo@northwind.example", role: "Viewer" },
];
</script>

<template>
  <Table class="max-w-[560px]" aria-label="Members of Northwind" :columns="columns" :rows="rows" />
</template>
