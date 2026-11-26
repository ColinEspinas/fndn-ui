<script lang="ts">
  import { Field, PasswordInput } from "@fndn/svelte";

  let password = $state("swordfish");
  const short = $derived(password.length > 0 && password.length < 12);
</script>

<!-- new-password: password managers offer to generate one; the error replaces the helper while too short -->
<Field label="New password" helper="At least 12 characters." error={`Too short: ${12 - password.length} more characters.`} invalid={short} class="w-full max-w-80">
  <PasswordInput bind:value={password} autoComplete="new-password" />
</Field>
