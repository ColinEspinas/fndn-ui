<script lang="ts">
  import { Collapsible } from "@fndn/svelte";

  let open = $state(true);
</script>

<Collapsible
  variant="row"
  bind:open={open}
  label="Build"
  meta="48s"
  detail="Installed 1,284 packages, compiled 312 modules and uploaded 14.2 MB of assets for dpl_7f3a9c."
  style="width: 320px"
/>
