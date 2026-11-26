<script lang="ts">
  import { Button, Spinner } from "@fndn/svelte";
</script>

<Button aria-disabled="true" aria-busy="true">
  {#snippet icon()}<Spinner decorative />{/snippet}
  Deploying to Production…
</Button>
