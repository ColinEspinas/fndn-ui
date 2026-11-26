<script setup lang="ts">
import { Card, CardBody, CardHeader, CardTitle, StatusPill, TextRow } from "@fndn/vue";
</script>

<template>
  <Card class="w-80 max-w-full">
    <CardHeader>
      <CardTitle>billing-api</CardTitle>
    </CardHeader>
    <CardBody>
      <TextRow label="Status">
        <template #value><StatusPill tone="green" size="sm">Healthy</StatusPill></template>
      </TextRow>
      <TextRow label="Region" value="Frankfurt" meta="eu-central-1" />
      <TextRow label="Runtime" value="Node 22" />
      <TextRow label="Created" value="Mar 3, 2026" />
    </CardBody>
  </Card>
</template>
