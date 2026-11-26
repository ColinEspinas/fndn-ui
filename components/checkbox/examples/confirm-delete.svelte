<script lang="ts">
  import { Button, Checkbox } from "@fndn/svelte";

  /* invalid until confirmed: the error says what to do, the action waits for it */
  let confirmed = $state(false);
</script>

<div class="flex w-80 flex-col items-start gap-3">
  <div class="flex flex-col gap-1">
    <Checkbox
      label="I understand that billing-api and its 128 deploys are deleted for good"
      checked={confirmed}
      oncheckedchange={(v) => (confirmed = v === true)}
      invalid={!confirmed}
    />
    {#if !confirmed}<p class="ps-6 text-xs text-red">Confirm to delete the project.</p>{/if}
  </div>
  <Button variant="danger" size="sm" disabled={!confirmed}>Delete billing-api</Button>
</div>
