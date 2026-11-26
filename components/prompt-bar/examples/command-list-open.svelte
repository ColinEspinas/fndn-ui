<script lang="ts">
  import { PromptBar, type PromptBarSource } from "@fndn/svelte";

  let value = $state("/");

  let model = $state("atlas-large");

  const models = [
    { value: "atlas-large", label: "Atlas Large", meta: "Most capable" },
    { value: "atlas-small", label: "Atlas Small", meta: "Fastest" },
  ];

  const sources: PromptBarSource[] = [
    { value: "accounts", label: "Customer accounts", description: "1,284 workspaces, plans and MRR", icon: "users" },
  ];

  const commands = [
    { value: "summarize", description: "Summarize this conversation" },
    { value: "draft-email", description: "Write an email to a customer" },
    { value: "query", description: "Ask the data warehouse in SQL" },
    { value: "chart", description: "Chart the last result" },
    { value: "ticket", description: "Open a support ticket" },
  ];
</script>

<!-- the composer sits at the foot of the chat; the list opens upward into the room above it -->
<div class="flex h-[300px] w-[420px] max-w-full flex-col justify-end">
  <PromptBar
    shape="rounded"
    bind:value={value}
    bind:model={model}
    {models}
    {sources}
    {commands}
  />
</div>
