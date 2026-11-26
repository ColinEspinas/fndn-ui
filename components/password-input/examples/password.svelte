<script lang="ts">
  import { Field, PasswordInput } from "@fndn/svelte";

  let password = $state("tidal-ledger-9-orbit");
</script>

<!-- the eye button shows the password while you check it; current-password lets managers fill it -->
<Field label="Password" class="w-full max-w-80">
  <PasswordInput bind:value={password} autoComplete="current-password" />
</Field>
