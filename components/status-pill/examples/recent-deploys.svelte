<script lang="ts">
  import { StatusPill } from "@fndn/svelte";

  const deploys = [
    { id: "dpl_7f3a9c", project: "web-app", when: "2 min ago", status: "Ready", tone: "green" },
    { id: "dpl_2c81e0", project: "billing-api", when: "Just now", status: "Building", tone: "orange" },
    { id: "dpl_9b04d7", project: "docs-site", when: "1 h ago", status: "Failed", tone: "red" },
  ] as const;
</script>

<ul class="flex w-80 flex-col divide-y divide-line text-sm">
  {#each deploys as deploy (deploy.id)}
    <li class="flex items-center gap-3 py-2">
      <span class="font-medium text-ink">{deploy.project}</span>
      <span class="flex-1 text-ink-2">{deploy.when}</span>
      <StatusPill tone={deploy.tone}>{deploy.status}</StatusPill>
    </li>
  {/each}
</ul>
