<script lang="ts">
  import { ScrollArea, StatusPill } from "@fndn/svelte";

  const previews = [
    { branch: "feat/usage-alerts", status: "Ready", tone: "green", when: "2 min ago" },
    { branch: "fix/invoice-rounding", status: "Building", tone: "accent", when: "Just now" },
    { branch: "chore/upgrade-vite", status: "Failed", tone: "red", when: "1 h ago" },
    { branch: "feat/sso", status: "Ready", tone: "green", when: "3 h ago" },
    { branch: "docs/webhook-retries", status: "Ready", tone: "green", when: "Yesterday" },
  ] as const;
</script>

<ScrollArea orientation="horizontal" class="w-full" aria-label="Preview deployments">
  <ul class="flex w-max gap-2 pb-3">
    {#each previews as preview (preview.branch)}
      <li class="flex w-44 shrink-0 flex-col gap-2 rounded-card bg-surface p-3 shadow-card">
        <p class="truncate text-sm font-medium text-ink" title={preview.branch}>{preview.branch}</p>
        <div class="flex items-center justify-between gap-2">
          <StatusPill tone={preview.tone} size="sm">{preview.status}</StatusPill>
          <span class="text-xs text-ink-2">{preview.when}</span>
        </div>
      </li>
    {/each}
  </ul>
</ScrollArea>
