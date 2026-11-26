import { useState } from "react";
import { Accordion, Button } from "@fndn/react";

/* free content after an item's detail: the actions of that section */
export default function Billing() {
  const [open, setOpen] = useState<string[]>(["plan"]);
  return (
    <Accordion
      variant="card"
      value={open}
      onValueChange={setOpen}
      style={{ width: 360 }}
      items={[
        {
          value: "plan",
          label: "Plan",
          meta: "Team",
          detail: "12 of 20 seats in use. Renews on Dec 1, 2026 at $240.00.",
          content: (
            <div className="flex gap-2 px-2.5 pb-2.5">
              <Button size="sm">Change plan</Button>
              <Button size="sm" variant="ghost">View invoices</Button>
            </div>
          ),
        },
        {
          value: "payment",
          label: "Payment method",
          meta: "Card ending 4242",
          detail: "Expires 08/2028. Receipts go to maya@northwind.example.",
          content: (
            <div className="flex gap-2 px-2.5 pb-2.5">
              <Button size="sm">Update card</Button>
            </div>
          ),
        },
      ]}
    />
  );
}
