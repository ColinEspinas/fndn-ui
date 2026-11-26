import { Slider } from "@fndn/react";

/* disabled: the setting stays readable, and the line under it says what unlocks it */
export default function FreePlan() {
  return (
    <div className="flex w-80 flex-col gap-2">
      <Slider label="Concurrent builds" showValue min={1} max={8} defaultValue={[1]} disabled />
      <p className="text-xs text-ink-2">The Free plan runs one build at a time. Upgrade to Team for up to 8.</p>
    </div>
  );
}
