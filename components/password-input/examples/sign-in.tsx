import { Button, Field, Input, PasswordInput } from "@fndn/react";

export default function SignIn() {
  return (
    <form className="flex w-full max-w-80 flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
      <Field label="Work email">
        <Input type="email" autoComplete="email" placeholder="maya@northwind.example" />
      </Field>
      <Field label="Password">
        <PasswordInput autoComplete="current-password" />
      </Field>
      <Button type="submit" variant="primary">Sign in</Button>
    </form>
  );
}
