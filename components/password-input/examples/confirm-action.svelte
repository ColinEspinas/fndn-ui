<script lang="ts">
  import Lock from "phosphor-svelte/lib/LockIcon";
  import { Field, PasswordInput } from "@fndn/svelte";

  let password = $state("");
</script>

<!-- asked again before a sensitive change; the lock marks the field as a confirmation -->
{#snippet start()}<Lock weight="bold" aria-hidden="true" />{/snippet}
<Field label="Confirm with your password" helper="Required to rotate the production API key." class="w-full max-w-80">
  <PasswordInput bind:value={password} {start} autoComplete="current-password" />
</Field>
