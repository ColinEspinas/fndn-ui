<script lang="ts">
  import { Button } from "@fndn/svelte";
</script>

<!-- disabled says why next to it: a disabled button alone gives no reason -->
<div class="flex max-w-80 flex-col items-start gap-2">
  <Button disabled aria-describedby="transfer-why">Transfer project</Button>
  <p id="transfer-why" class="text-sm text-ink-2">Only Maya Chen, the workspace owner, can transfer projects.</p>
</div>
