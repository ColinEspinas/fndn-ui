<script lang="ts">
  import { Tag } from "@fndn/svelte";

  let files = $state(["deploy-log.txt", "checkout-error.png"]);
</script>

<!-- pill tags in a pill-shaped host (a comment box), with a tooltip on the remove button -->
<div class="flex flex-wrap gap-1.5">
  {#each files as file (file)}
    <Tag shape="pill" removable removeLabel={`Remove ${file}`} removeTooltip="Remove" onremove={() => (files = files.filter((f) => f !== file))}>
      {file}
    </Tag>
  {/each}
</div>
