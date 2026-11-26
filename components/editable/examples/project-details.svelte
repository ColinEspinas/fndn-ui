<script lang="ts">
  import { Editable, TextRow } from "@fndn/svelte";

  let branch = $state("main");
  let command = $state("pnpm build");
  let timeout = $state("15");
</script>

<!-- inline: the value of a detail row, edited in place -->
{#snippet branchValue()}<Editable bind:value={branch} variant="inline" aria-label="Production branch" />{/snippet}
{#snippet commandValue()}<Editable bind:value={command} variant="inline" aria-label="Build command" />{/snippet}
{#snippet timeoutValue()}<Editable bind:value={timeout} variant="inline" aria-label="Build timeout in minutes" />{/snippet}

<div style="width: 320px">
  <TextRow label="Production branch" value={branchValue} />
  <TextRow label="Build command" value={commandValue} />
  <TextRow label="Build timeout" value={timeoutValue} meta="min" />
</div>
