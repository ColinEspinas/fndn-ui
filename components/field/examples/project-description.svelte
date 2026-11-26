<script lang="ts">
  import { Field, Textarea } from "@fndn/svelte";

  let description = $state("");
</script>

<Field label="Description" helper="Shown on the project's overview page." class="w-full max-w-80">
  <Textarea bind:value={description} placeholder="What this project does and who owns it" />
</Field>
