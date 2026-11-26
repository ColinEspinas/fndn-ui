import { Button, Field, Input, InputGroup } from "@fndn/react";

/* fields stack with a 16px gap; required ones show an asterisk */
export default function CreateWorkspace() {
  return (
    <form className="flex w-full max-w-80 flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
      <Field label="Workspace name" required>
        <Input placeholder="Northwind" autoComplete="organization" />
      </Field>
      <Field label="Workspace URL" helper="You can change it later in settings.">
        <InputGroup start="app.example.com/" placeholder="northwind" />
      </Field>
      <Field label="Your work email" required>
        <Input type="email" placeholder="maya@northwind.example" autoComplete="email" />
      </Field>
      <Button type="submit" variant="primary">Create workspace</Button>
    </form>
  );
}
