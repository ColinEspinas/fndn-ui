<script lang="ts">
  import { PinInput } from "@fndn/svelte";
</script>

<!-- mask: dots instead of digits, for a PIN someone could read over a shoulder -->
<PinInput label="PIN to reveal production secrets" length={4} mask />
