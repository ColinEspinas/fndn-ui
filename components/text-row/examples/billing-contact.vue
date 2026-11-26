<script setup lang="ts">
import { TextRow } from "@fndn/vue";
</script>

<!-- a long label wraps; the value keeps its column and is never cut -->
<template>
  <div class="flex w-80 flex-col">
    <TextRow label="Billing email" value="billing@northwind.example" />
    <TextRow label="Tax ID for invoices issued to the Northwind workspace" value="DE 811 907 435" />
  </div>
</template>
