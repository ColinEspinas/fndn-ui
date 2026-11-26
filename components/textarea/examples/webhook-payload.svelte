<script lang="ts">
  import { Textarea } from "@fndn/svelte";

  let payload = $state('{\n  "event": "deploy.failed",\n  "project": "billing-api",\n  "deploy": "dpl_7f3a9c",\n  "commit": "a1b2c3d"\n}');
</script>

<!-- autoResize off: a fixed height with a resize handle; mono for code -->
<Textarea bind:value={payload} autoResize={false} rows={6} mono aria-label="Test payload" class="w-full max-w-80" />
