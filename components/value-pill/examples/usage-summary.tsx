import { ValuePill } from "@fndn/react";

export default function UsageSummary() {
  return (
    <p className="max-w-[300px] text-md text-ink">
      web-app has used <ValuePill tone="orange">4,920 of 6,000</ValuePill> build minutes this month. The count resets on <ValuePill>Dec 1, 2026</ValuePill>; the <ValuePill>Business</ValuePill> plan includes 20,000.
    </p>
  );
}
