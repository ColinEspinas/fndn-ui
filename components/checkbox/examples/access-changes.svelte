<script lang="ts">
  import { Checkbox } from "@fndn/svelte";

  /* tone: green for a change that adds, red for one that removes; the label says which */
  let add = $state(true);
  let remove = $state(true);
</script>

<fieldset class="flex w-80 flex-col gap-2.5">
  <legend class="mb-3 text-sm font-medium text-ink">Apply 2 access changes</legend>
  <Checkbox bind:checked={add} tone="green" label="Add Priya Raman to billing-api as maintainer" />
  <Checkbox bind:checked={remove} tone="red" label="Remove Lucas Moreau from mobile" />
</fieldset>
