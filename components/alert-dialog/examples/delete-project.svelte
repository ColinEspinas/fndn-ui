<script lang="ts">
  import { AlertDialog } from "@fndn/svelte";

  async function deleteProject(id: string) {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
  }
</script>

<!-- an alert dialog interrupts to confirm: no close button, a click outside does nothing, focus
     starts on Cancel and the question is announced at once (role="alertdialog") -->
<div class="flex w-80 items-center gap-3">
  <div class="min-w-0 flex-1">
    <div class="text-sm font-medium text-ink">Delete this project</div>
    <div class="text-xs text-ink-2">Removes billing-api and all its deploys</div>
  </div>
  <AlertDialog
    triggerLabel="Delete project"
    title="Delete billing-api?"
    description="This deletes the project, its 214 deploys and its environment variables for everyone at Northwind. You cannot undo it."
    actionLabel="Delete project"
    onaction={() => deleteProject("billing-api")}
  />
</div>
