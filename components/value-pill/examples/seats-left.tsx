import { ValuePill } from "@fndn/react";

export default function SeatsLeft() {
  return (
    <p className="max-w-[300px] text-md text-ink">
      You have <ValuePill tone="accent">8 seats</ValuePill> left on the Team plan, enough for the <ValuePill>Platform team</ValuePill> invite.
    </p>
  );
}
