import { Input, Label } from "@fndn/react";

/* on its own, a label points at its control with htmlFor (inside a Field this is done for you) */
export default function EmailAddress() {
  return (
    <div className="flex w-full max-w-80 flex-col gap-1.5">
      <Label htmlFor="signup-email">Email address</Label>
      <Input id="signup-email" type="email" autoComplete="email" placeholder="maya@northwind.example" />
    </div>
  );
}
