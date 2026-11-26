<script lang="ts">
  import DownloadSimple from "phosphor-svelte/lib/DownloadSimpleIcon";
  import { Button, Select } from "@fndn/svelte";

  const statuses = ["All statuses", "Ready", "Building", "Failed", "Canceled"];
  const ranges = ["Last 24 hours", "Last 7 days", "Last 30 days"];

  let status = $state<string | null>("All statuses");
  let range = $state<string | null>("Last 7 days");
</script>

<!-- sm Selects and an sm Button line up at 28px -->
<div class="flex flex-wrap items-center gap-2">
  <Select items={statuses} bind:value={status} size="sm" aria-label="Status" style="width: 136px" />
  <Select items={ranges} bind:value={range} size="sm" aria-label="Date range" style="width: 136px" />
  <Button size="sm">
    {#snippet icon()}<DownloadSimple data-slot="icon" weight="bold" />{/snippet}
    Export
  </Button>
</div>
