import { Input, Label } from "@fndn/react";

/* when most fields are required, mark the few optional ones instead of every required one */
export default function OptionalField() {
  return (
    <div className="flex w-full max-w-80 flex-col gap-1.5">
      <Label htmlFor="vat-number">
        VAT number <span className="font-normal text-ink-2">(optional)</span>
      </Label>
      <Input id="vat-number" mono placeholder="DE123456789" />
    </div>
  );
}
