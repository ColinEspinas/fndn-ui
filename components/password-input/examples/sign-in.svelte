<script lang="ts">
  import { Button, Field, Input, PasswordInput } from "@fndn/svelte";
</script>

<form class="flex w-full max-w-80 flex-col gap-4" onsubmit={(event) => event.preventDefault()}>
  <Field label="Work email">
    <Input type="email" autocomplete="email" placeholder="maya@northwind.example" />
  </Field>
  <Field label="Password">
    <PasswordInput autoComplete="current-password" />
  </Field>
  <Button type="submit" variant="primary">Sign in</Button>
</form>
