<script setup lang="ts">
import { ref } from "vue";
import { PromptBar } from "@fndn/vue";

const value = ref("Check these invoices against the October payouts and flag any mismatch");

const attachments = ref(["INV-0117.pdf", "payouts-2024-10.csv", "kestrel-logistics-master-services-agreement.pdf"]);

const model = ref("atlas-large");

const models = [
  { value: "atlas-large", label: "Atlas Large", meta: "Most capable" },
  { value: "atlas-small", label: "Atlas Small", meta: "Fastest" },
];

const sources = [
  { value: "billing", label: "Billing", description: "Invoices, refunds and payouts", icon: "database" },
  { value: "accounts", label: "Customer accounts", description: "1,284 workspaces, plans and MRR", icon: "users" },
];
</script>

<template>
  <PromptBar
    shape="rounded"
    v-model:value="value"
    v-model:attachments="attachments"
    v-model:model="model"
    :models="models"
    :sources="sources"
    style="width: 420px"
  />
</template>
