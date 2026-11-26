<script lang="ts">
  import { Editable } from "@fndn/svelte";

  let title = $state("v2.14: usage alerts and invoice fixes");
</script>

<!-- controls: Edit, Save and Cancel buttons for people who do not guess the double-click -->
<Editable
  bind:value={title}
  label="Release title"
  controls
  activationMode="dblclick"
  style="width: 340px"
/>
