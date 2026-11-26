import { ValuePill } from "@fndn/react";

export default function Uptime() {
  return (
    <p className="max-w-[300px] text-md text-ink">
      Production answered <ValuePill tone="green">99.98%</ValuePill> of requests in the last 30 days, with a median response of <ValuePill>142 ms</ValuePill>.
    </p>
  );
}
