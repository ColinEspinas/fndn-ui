<script setup lang="ts">
import { PhDownloadSimple } from "@phosphor-icons/vue";
import { Button, Card, CardBody, CardDescription, CardFooter, CardHeader, CardTitle, PageHeader, TextRow } from "@fndn/vue";

const usage = [
  { label: "Seats", value: "12", meta: "of 20" },
  { label: "Build minutes", value: "4,120", meta: "of 6,000" },
  { label: "Bandwidth", value: "182 GB", meta: "of 1 TB" },
];
</script>

<!-- at phone width the title keeps its line: when the actions do not fit beside 10rem of text they
     drop under it, at its start, and nothing is cut -->
<template>
  <div class="flex w-[358px] max-w-full flex-col gap-6">
    <PageHeader title="Billing" description="Invoices go to maya@northwind.example on the 1st." :back="{ label: 'Settings', href: '/settings' }">
      <template #actions>
        <Button size="sm">
          <template #icon><PhDownloadSimple data-slot="icon" weight="bold" /></template>
          Invoices
        </Button>
        <Button size="sm">Payment method</Button>
      </template>
    </PageHeader>
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Team plan</CardTitle>
          <CardDescription>$240.00 a month · renews Dec 1, 2026</CardDescription>
        </div>
      </CardHeader>
      <CardBody>
        <TextRow v-for="row in usage" :key="row.label" :label="row.label" :value="row.value" :meta="row.meta" />
      </CardBody>
      <CardFooter>
        <Button variant="primary" size="sm">Upgrade to Business</Button>
      </CardFooter>
    </Card>
  </div>
</template>
