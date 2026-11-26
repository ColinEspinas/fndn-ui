<script lang="ts">
  import { Field, InputGroup } from "@fndn/svelte";

  let limit = $state("1,240.00");
</script>

<!-- text addons give the unit; inside a Field the label and helper are wired as for an Input -->
<Field label="Spending limit" helper="Deploys pause when the month reaches it." class="w-full max-w-80">
  <InputGroup bind:value={limit} start="$" end="USD" inputmode="decimal" />
</Field>
