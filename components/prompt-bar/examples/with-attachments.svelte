<script lang="ts">
  import { PromptBar, type PromptBarSource } from "@fndn/svelte";

  let value = $state("Check these invoices against the October payouts and flag any mismatch");

  let attachments = $state(["INV-0117.pdf", "payouts-2024-10.csv", "kestrel-logistics-master-services-agreement.pdf"]);

  let model = $state("atlas-large");

  const models = [
    { value: "atlas-large", label: "Atlas Large", meta: "Most capable" },
    { value: "atlas-small", label: "Atlas Small", meta: "Fastest" },
  ];

  const sources: PromptBarSource[] = [
    { value: "billing", label: "Billing", description: "Invoices, refunds and payouts", icon: "database" },
    { value: "accounts", label: "Customer accounts", description: "1,284 workspaces, plans and MRR", icon: "users" },
  ];
</script>

<PromptBar
  shape="rounded"
  bind:value={value}
  bind:attachments={attachments}
  bind:model={model}
  models={models}
  sources={sources}
  style="width: 420px"
/>
