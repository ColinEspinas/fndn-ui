import type { ComponentProps } from "react";
import { RadioGroup } from "@fndn/react";

/* horizontal: two or three short options in a row */
type Props = ComponentProps<typeof RadioGroup>;

const cycles: Props["items"] = [
  { value: "monthly", label: "Monthly · $24 per seat" },
  { value: "yearly", label: "Yearly · $19 per seat" },
];

export default function BillingCycle() {
  return <RadioGroup name="cycle" label="Billing cycle" orientation="horizontal" items={cycles} defaultValue="yearly" />;
}
