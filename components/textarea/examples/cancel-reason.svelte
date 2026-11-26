<script lang="ts">
  import { Field, Textarea } from "@fndn/svelte";

  let reason = $state("");
</script>

<Field label="Why are you cancelling?" helper="Optional. Read by the billing team, never shared." class="w-full max-w-80">
  <Textarea bind:value={reason} placeholder="Missing a feature, too expensive, moving to another tool…" />
</Field>
