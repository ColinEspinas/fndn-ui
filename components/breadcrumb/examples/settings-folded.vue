<script setup lang="ts">
import { Breadcrumb } from "@fndn/vue";
</script>

<!-- a deep page keeps the first and the last two; the ⋯ menu holds the rest -->
<template>
  <Breadcrumb
    :maxItems="3"
    :items="[
      { label: 'Northwind', href: '/northwind' },
      { label: 'billing-api', href: '/northwind/billing-api' },
      { label: 'Settings', href: '/northwind/billing-api/settings' },
      { label: 'Environment variables', href: '/northwind/billing-api/settings/env' },
      { label: 'Production', href: '/northwind/billing-api/settings/env/production' },
      { label: 'STRIPE_WEBHOOK_SECRET' },
    ]"
  />
</template>
