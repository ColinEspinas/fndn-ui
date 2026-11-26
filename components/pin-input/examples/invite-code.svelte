<script lang="ts">
  import { PinInput } from "@fndn/svelte";

  let code = $state(["N", "W", "7"]);
</script>

<!-- alphanumeric: letters and digits, as printed on the invite -->
<PinInput bind:value={code} label="Invite code" type="alphanumeric" length={6} />
