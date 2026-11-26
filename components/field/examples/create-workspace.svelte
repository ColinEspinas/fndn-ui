<script lang="ts">
  import { Button, Field, Input, InputGroup } from "@fndn/svelte";
</script>

<!-- fields stack with a 16px gap; required ones show an asterisk -->
<form class="flex w-full max-w-80 flex-col gap-4" onsubmit={(event) => event.preventDefault()}>
  <Field label="Workspace name" required>
    <Input placeholder="Northwind" autocomplete="organization" />
  </Field>
  <Field label="Workspace URL" helper="You can change it later in settings.">
    <InputGroup start="app.example.com/" placeholder="northwind" />
  </Field>
  <Field label="Your work email" required>
    <Input type="email" placeholder="maya@northwind.example" autocomplete="email" />
  </Field>
  <Button type="submit" variant="primary">Create workspace</Button>
</form>
