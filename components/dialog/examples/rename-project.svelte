<script lang="ts">
  import { Dialog, Field, Input, type DialogAction } from "@fndn/svelte";

  /* Rename submits the form in the body: the browser checks the required field, Enter in it
   * renames, and the dialog closes on the form's submit */
  const actions: DialogAction[] = [
    { label: "Cancel", value: "cancel", variant: "ghost" },
    { label: "Rename", value: "rename", variant: "primary", form: "rename-project-form" },
  ];

  let project = $state("billing-api");
  let name = $state("billing-api");

  function rename(event: SubmitEvent) {
    event.preventDefault();
    project = name.trim() || project;
  }
</script>

<div class="flex w-80 items-center gap-3">
  <div class="min-w-0 flex-1">
    <div class="text-sm font-medium text-ink">Project name</div>
    <div class="truncate text-xs text-ink-2" title={`northwind.dev/${project}`}>{`northwind.dev/${project}`}</div>
  </div>
  <Dialog
    size="sm"
    triggerLabel="Rename"
    title="Rename project"
    {actions}
    initialFocus="input"
    onopenchange={(open) => { if (open) name = project; }}
  >
    <form id="rename-project-form" onsubmit={rename}>
      <Field label="Project name" required helper={`URLs become northwind.dev/${name.trim() || "…"}.`}>
        <Input bind:value={name} name="name" />
      </Field>
    </form>
  </Dialog>
</div>
