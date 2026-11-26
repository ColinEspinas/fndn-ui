<script lang="ts">
  import { ScrollArea } from "@fndn/svelte";

  const notes = [
    "Usage alerts: get an email when a project reaches 80% and 100% of its monthly build minutes. Set the thresholds in Settings → Billing.",
    "Webhook deliveries now retry five times with exponential backoff before they are marked as failed. Failed deliveries can be replayed from the log for 30 days.",
    "Preview deployments get a comment on their pull request with the URL and the build time.",
    "Fixed: invoices for workspaces that changed plans in the middle of a month rounded the prorated amount down by one cent.",
  ];
</script>

<ScrollArea class="h-48 w-80 max-w-full rounded-card bg-surface shadow-card" aria-label="What’s new in v2.14">
  <div class="flex flex-col gap-3 p-4 text-sm leading-normal text-ink-2">
    <p class="font-medium text-ink">What’s new in v2.14 · Nov 14, 2026</p>
    {#each notes as note (note)}
      <p>{note}</p>
    {/each}
  </div>
</ScrollArea>
