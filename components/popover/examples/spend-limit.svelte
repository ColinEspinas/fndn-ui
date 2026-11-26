<script lang="ts">
  import { Button, Field, Input, Popover } from "@fndn/svelte";

  /* edit one value where it is shown; Save closes the popover (open is controlled) */
  let open = $state(false);
  let limit = $state("500");
  let draft = $state("500");

  function save(event: SubmitEvent) {
    event.preventDefault();
    limit = draft;
    open = false;
  }
</script>

<div class="flex w-80 items-center justify-between gap-3">
  <div class="flex flex-col">
    <span class="text-sm font-medium text-ink">Monthly spend limit</span>
    <span class="text-xs text-ink-2">$312.40 used this month</span>
  </div>
  <Popover
    bind:open
    onopenchange={() => (draft = limit)}
    placement="bottom-end"
    title="Monthly spend limit"
    description="Deploys pause when usage reaches the limit. Owners get an email at 80%."
  >
    {#snippet trigger(props)}
      <Button {...props()} size="sm">${Number(limit).toLocaleString("en-US")}</Button>
    {/snippet}
    <form class="flex items-end gap-2" onsubmit={save}>
      <Field label="Limit in USD" class="flex-1">
        <Input bind:value={draft} inputmode="numeric" />
      </Field>
      <Button type="submit" variant="primary">Save</Button>
    </form>
  </Popover>
</div>
