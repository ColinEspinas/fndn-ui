<script lang="ts">
  import { Editable } from "@fndn/svelte";

  let name = $state("Failed deploys this week");
</script>

<!-- sm: a saved view's name in a sidebar, renamed where it is -->
<Editable bind:value={name} size="sm" aria-label="View name" style="width: 220px" />
