<script lang="ts">
  import { Select } from "@fndn/svelte";

  const environments = [
    { value: "production", label: "Production", meta: "main" },
    { value: "staging", label: "Staging", meta: "release/2026.11" },
    { value: "preview", label: "Preview", meta: "feat/usage-alerts" },
  ];

  let environment = $state<string | null>("staging");
</script>

<Select
  items={environments}
  bind:value={environment}
  placeholder="Choose an environment"
  label="Deploy to"
  style="width: 240px"
/>
