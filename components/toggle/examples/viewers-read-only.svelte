<script lang="ts">
  import GitBranch from "phosphor-svelte/lib/GitBranchIcon";
  import { Toggle } from "@fndn/svelte";
</script>

<!-- disabled keeps its pressed state visible and says who can change it -->
<div class="flex max-w-80 flex-col items-start gap-2">
  <Toggle size="sm" disabled pressed aria-describedby="auto-merge-why">
    {#snippet icon()}<GitBranch data-slot="icon" weight="bold" />{/snippet}
    Auto-merge
  </Toggle>
  <p id="auto-merge-why" class="text-sm text-ink-2">You have viewer access to web-app. Ask a maintainer to change this.</p>
</div>
