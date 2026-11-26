<script lang="ts">
  import { Editable } from "@fndn/svelte";

  let description = $state("Webhook deliveries that time out are dropped today.\nRetry them three times with backoff, then mark the event failed.");
</script>

<!-- a description reads as plain text; the field appears only while editing. Enter starts a new line,
     Cmd/Ctrl+Enter or a click away saves -->
<Editable bind:value={description} aria-label="Description" multiline size="sm" placeholder="Add a description…" style="width: 360px" />
