import { Progress } from "@fndn/react";

const meters = [
  { label: "Build minutes", value: 71, text: "2,140 of 3,000 min", tone: "accent" },
  { label: "Bandwidth", value: 92, text: "92 of 100 GB", tone: "orange" },
  { label: "Seats", value: 100, text: "12 of 12 seats", tone: "red" },
] as const;

export default function PlanLimits() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      {meters.map((meter) => (
        <Progress key={meter.label} value={meter.value} label={meter.label} showValue valueText={meter.text} tone={meter.tone} />
      ))}
    </div>
  );
}
