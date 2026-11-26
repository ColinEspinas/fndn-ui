<script lang="ts">
  import { Field, Input } from "@fndn/svelte";

  let name = $state("billing-api");
</script>

<!-- an Input almost always sits in a Field: the label and the helper are wired to it -->
<Field label="Project name" helper="Used in URLs and the CLI: lowercase and dashes." class="w-full max-w-80">
  <Input bind:value={name} autocomplete="off" />
</Field>
