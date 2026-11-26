import { Field, Input } from "@fndn/react";

/* the field wires the label (for / id) and the helper (aria-describedby) to the control */
export default function BillingEmail() {
  return (
    <Field label="Billing email" helper="Invoices and receipts are sent here." className="w-full max-w-80">
      <Input type="email" autoComplete="email" defaultValue="billing@northwind.example" />
    </Field>
  );
}
