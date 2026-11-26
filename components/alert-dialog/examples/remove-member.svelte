<script lang="ts">
  import { AlertDialog, Checkbox } from "@fndn/svelte";

  let reassign = $state(true);
</script>

<!-- a body under the description: one choice that changes what the action does -->
<AlertDialog
  triggerLabel="Remove member"
  title="Remove Daniel Okafor from Northwind?"
  description="Daniel loses access to every project at once. Their deploys and comments stay."
  actionLabel="Remove member"
>
  <Checkbox bind:checked={reassign} label="Reassign Daniel's 12 open reviews to me" />
</AlertDialog>
