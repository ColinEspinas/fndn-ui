<script lang="ts">
  import RocketLaunch from "phosphor-svelte/lib/RocketLaunchIcon";
  import { Button, Combobox } from "@fndn/svelte";

  const branches = [
    { value: "main", label: "main", meta: "2 min ago" },
    { value: "feat/usage-alerts", label: "feat/usage-alerts", meta: "1 h ago" },
    { value: "fix/invoice-rounding", label: "fix/invoice-rounding", meta: "Yesterday" },
    { value: "release/2026.11", label: "release/2026.11", meta: "Nov 12" },
    { value: "chore/upgrade-node-22-and-pnpm-11-across-workspace", label: "chore/upgrade-node-22-and-pnpm-11-across-workspace", meta: "Nov 3" },
  ];

  let branch = $state<string | null>("main");
</script>

<!-- sm: the combobox and the sm Button share the 28px row -->
<div class="flex items-center gap-2">
  <Combobox items={branches} bind:value={branch} size="sm" aria-label="Branch" placeholder="Search branches" style="width: 200px" />
  <Button size="sm" variant="primary">
    {#snippet icon()}<RocketLaunch data-slot="icon" weight="bold" />{/snippet}
    Deploy
  </Button>
</div>
