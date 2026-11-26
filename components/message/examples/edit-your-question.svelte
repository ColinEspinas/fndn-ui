<script lang="ts">
  import { Message, Textarea } from "@fndn/svelte";

  let text = $state("Which invoices failed to send in November?");
  let editing = $state(false);
  function onKey(e: KeyboardEvent & { currentTarget: HTMLTextAreaElement }) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); text = e.currentTarget.value.trim() || text; editing = false; }
    if (e.key === "Escape") editing = false;
  }
</script>

<!-- Edit turns the bubble into a field; Enter keeps the new text -->
<div class="flex w-80 flex-col items-end">
  {#if editing}
    <!-- svelte-ignore a11y_autofocus -->
    <Textarea autofocus aria-label="Edit your message" value={text} rows={2} onkeydown={onKey} />
  {:else}
    <Message role="user" name="Maya Chen" time="10:42" {text} actions={["copy", "edit"]} onaction={(a) => a === "edit" && (editing = true)} />
  {/if}
</div>
