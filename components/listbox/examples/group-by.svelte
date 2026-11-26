<script lang="ts">
  import { Listbox } from "@fndn/svelte";

  let group = $state(["Environment"]);
</script>

<!-- sm: the dense size for side panels and popovers -->
<Listbox items={["Project", "Environment", "Author", "No grouping"]} bind:value={group} size="sm" label="Group deploys by" style="width: 180px" />
