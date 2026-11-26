import { useState } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { Toggle } from "@fndn/react";

/* ghost: no fill at rest, for a filter that sits in a list header */
export default function FailedOnly() {
  const [failedOnly, setFailedOnly] = useState(false);
  return (
    <div className="flex w-full max-w-80 items-center justify-between gap-3">
      <p className="text-sm font-medium text-ink">{failedOnly ? "3 failed deploys" : "48 deploys this week"}</p>
      <Toggle variant="ghost" size="sm" pressed={failedOnly} onPressedChange={setFailedOnly} icon={<WarningCircle data-slot="icon" weight="bold" />}>
        Failed only
      </Toggle>
    </div>
  );
}
