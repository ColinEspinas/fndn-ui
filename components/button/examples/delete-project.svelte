<script lang="ts">
  import Trash from "phosphor-svelte/lib/TrashIcon";
  import { Button } from "@fndn/svelte";
</script>

<!-- a danger zone: the outline danger look (red edge, red fill on hover); the filled danger is for the confirmation that follows. The label names what goes -->
<div class="flex max-w-96 flex-col items-start gap-3">
  <div>
    <p class="text-sm font-medium text-ink">Delete billing-api</p>
    <p class="text-sm text-ink-2">Removes 128 deploys, 3 environments and every API key of this project.</p>
  </div>
  <Button variant="danger-outline">
    {#snippet icon()}<Trash data-slot="icon" weight="bold" />{/snippet}
    Delete project
  </Button>
</div>
