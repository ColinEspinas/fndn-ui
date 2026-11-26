<script lang="ts">
  import { AlertDialog } from "@fndn/svelte";
</script>

<!-- consequential but not destructive: tone="neutral" makes the action a primary button -->
<AlertDialog
  tone="neutral"
  triggerLabel="Promote to Production"
  title="Promote a1b2c3d to Production?"
  description="Every visitor of web-app gets this version within a minute. You can roll back from the deploy list."
  actionLabel="Promote to Production"
/>
