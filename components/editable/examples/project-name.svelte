<script lang="ts">
  import { Editable } from "@fndn/svelte";

  let name = $state("billing-api");
</script>

<!-- reads as text until focused or clicked; Enter saves, Escape puts the old name back -->
<Editable bind:value={name} label="Project name" style="width: 260px" />
