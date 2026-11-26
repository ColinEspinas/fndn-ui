<script setup lang="ts">
import { ref } from "vue";
import { Field, Input } from "@fndn/vue";

const email = ref("billing@northwind.example");
</script>

<!-- the field wires the label (for / id) and the helper (aria-describedby) to the control -->
<template>
  <Field label="Billing email" helper="Invoices and receipts are sent here." class="w-full max-w-80">
    <Input v-model:value="email" type="email" autocomplete="email" />
  </Field>
</template>
