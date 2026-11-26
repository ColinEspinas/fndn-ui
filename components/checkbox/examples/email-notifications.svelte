<script lang="ts">
  import { Checkbox } from "@fndn/svelte";

  /* independent options under one heading: a fieldset and its legend name the group */
  let deployFailed = $state(true);
  let reviewRequested = $state(true);
  let usage = $state(false);
</script>

<fieldset class="flex w-80 flex-col gap-2.5">
  <legend class="mb-3 text-sm font-medium text-ink">Email me when</legend>
  <Checkbox bind:checked={deployFailed} name="email" value="deploy-failed" label="A deploy to Production fails" />
  <Checkbox bind:checked={reviewRequested} name="email" value="review-requested" label="Someone requests my review" />
  <Checkbox bind:checked={usage} name="email" value="usage" label="Usage passes 80% of the Team plan" />
</fieldset>
