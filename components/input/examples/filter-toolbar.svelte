<script lang="ts">
  import DownloadSimple from "phosphor-svelte/lib/DownloadSimpleIcon";
  import { Button, Input } from "@fndn/svelte";

  let query = $state("");
</script>

<!-- sm: 28px, the same height as the sm Button beside it -->
<div class="flex w-full max-w-[360px] items-center gap-2">
  <Input bind:value={query} size="sm" type="search" placeholder="Filter by branch or commit" aria-label="Filter deploys" class="min-w-0 flex-1" />
  <Button size="sm">
    {#snippet icon()}<DownloadSimple data-slot="icon" weight="bold" />{/snippet}
    Export
  </Button>
</div>
