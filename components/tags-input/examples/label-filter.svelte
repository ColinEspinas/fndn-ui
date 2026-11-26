<script lang="ts">
  import { Button, TagsInput } from "@fndn/svelte";

  let labels = $state<string[]>(["bug", "p1"]);
</script>

<!-- sm: 28px, beside an sm Button in a list's toolbar -->
<div class="flex items-center gap-2" style="width: 320px">
  <TagsInput bind:value={labels} size="sm" aria-label="Filter by label" placeholder="Label" class="min-w-0 flex-1" />
  <Button size="sm" variant="secondary" disabled={labels.length === 0} onclick={() => (labels = [])}>Clear</Button>
</div>
