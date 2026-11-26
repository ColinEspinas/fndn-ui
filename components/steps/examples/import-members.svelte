<script lang="ts">
  import { Button, Steps } from "@fndn/svelte";

  const items = [{ title: "Upload CSV" }, { title: "Match columns" }, { title: "Invite" }];

  /* your own buttons drive the step; the last one names what it does */
  let step = $state(0);
  const done = $derived(step === items.length);
  const last = $derived(step === items.length - 1);
</script>

<div class="flex w-80 flex-col gap-4">
  <Steps linear bind:step {items} />
  <div class="flex justify-end gap-2">
    <Button size="sm" disabled={step === 0 || done} onclick={() => (step = step - 1)}>Back</Button>
    <Button size="sm" variant="primary" onclick={() => (step = done ? 0 : step + 1)}>{done ? "Import more" : last ? "Invite 18 people" : "Next"}</Button>
  </div>
</div>
