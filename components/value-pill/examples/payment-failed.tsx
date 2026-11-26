import { ValuePill } from "@fndn/react";

export default function PaymentFailed() {
  return (
    <p className="max-w-[300px] text-md text-ink">
      The charge of <ValuePill tone="red">$1,240.00</ValuePill> for <ValuePill>INV-2024-0117</ValuePill> was declined. We will try the card again on <ValuePill>Nov 18, 2026</ValuePill>.
    </p>
  );
}
