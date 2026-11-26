import { Bell, DeviceMobile, EnvelopeSimple } from "@phosphor-icons/react";
import { ToggleGroup } from "@fndn/react";

/* several channels at once; one the plan does not include is disabled and says why */
const channels = [
  { value: "email", label: "Email", icon: <EnvelopeSimple data-slot="icon" weight="bold" /> },
  { value: "in-app", label: "In app", icon: <Bell data-slot="icon" weight="bold" /> },
  { value: "sms", label: "SMS", icon: <DeviceMobile data-slot="icon" weight="bold" />, tooltip: "SMS alerts need the Business plan", disabled: true },
];

export default function NotifyChannels() {
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-sm font-medium text-ink">When a deploy fails, notify me by</p>
      <ToggleGroup aria-label="When a deploy fails, notify me by" multiple size="sm" defaultValue={["email", "in-app"]} items={channels} />
    </div>
  );
}
