<script lang="ts">
  import Plus from "phosphor-svelte/lib/PlusIcon";
  import { Button, EmptyState } from "@fndn/svelte";
</script>

<!-- the next step under the text: the one thing to do in an empty project -->
<EmptyState size="block" icon="folder-open" title="No open issues in billing-api" hint="Issues you create or import show up here.">
  {#snippet action()}
    <Button variant="outline" size="sm" shape="rounded">
      {#snippet icon()}<Plus data-slot="icon" weight="bold" />{/snippet}
      New issue
    </Button>
  {/snippet}
</EmptyState>
