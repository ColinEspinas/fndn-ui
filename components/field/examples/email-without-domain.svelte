<script lang="ts">
  import { Field, Input } from "@fndn/svelte";

  let email = $state("daniel@northwind");
  const invalid = $derived(email !== "" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email));
</script>

<!-- invalid: the control's ring turns red and the error takes the helper's place -->
<Field
  label="Invite by email"
  helper="They get a link to join Northwind."
  error="Add the domain, like daniel@northwind.example."
  {invalid}
  class="w-full max-w-80"
>
  <Input bind:value={email} type="email" />
</Field>
