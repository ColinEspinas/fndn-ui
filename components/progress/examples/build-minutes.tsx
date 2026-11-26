import { Progress } from "@fndn/react";

export default function BuildMinutes() {
  return <Progress className="w-full" value={2140} max={3000} label="Build minutes this month" showValue valueText="2,140 of 3,000 min" tone="accent" />;
}
