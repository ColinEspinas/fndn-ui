import { NumberInput } from "@fndn/react";

/* formatOptions shows the value as money; the steppers move by $50 */
export default function SpendLimit() {
  return (
    <NumberInput
      label="Monthly spend limit"
      defaultValue="500"
      min={0}
      step={50}
      formatOptions={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
      className="w-48"
    />
  );
}
