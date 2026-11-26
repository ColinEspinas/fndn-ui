<script lang="ts">
  import CheckCircle from "phosphor-svelte/lib/CheckCircleIcon";
  import { Spinner } from "@fndn/svelte";

  const deploys = [
    { id: "dpl_7f3a9c", branch: "feat/usage-alerts", building: true, status: "Building · 1m 12s" },
    { id: "dpl_51e0b2", branch: "main", building: false, status: "Ready · 2 min ago" },
    { id: "dpl_0c94d7", branch: "fix/tax-rounding", building: false, status: "Ready · 1 h ago" },
  ];
</script>

<ul class="flex w-80 max-w-full flex-col gap-2 text-sm">
  {#each deploys as deploy (deploy.id)}
    <li class="flex items-center gap-2">
      {#if deploy.building}
        <Spinner label="Building" />
      {:else}
        <CheckCircle data-slot="icon" weight="fill" class="shrink-0 text-green" aria-hidden="true" />
      {/if}
      <span class="min-w-0 flex-1 truncate text-ink" title={deploy.branch}>{deploy.branch}</span>
      <span class="shrink-0 text-ink-2 tabular-nums">{deploy.status}</span>
    </li>
  {/each}
</ul>
