import { Bell, DeviceMobile, EnvelopeSimple, Link } from "@phosphor-icons/react";
import { Listbox } from "@fndn/react";

/* an icon says what kind of channel, a one-line description where it goes; a long one is cut, with a title */
const channels = [
  { value: "email", label: "Email", description: "maya@northwind.example and 3 teammates", icon: <EnvelopeSimple data-slot="icon" weight="bold" /> },
  { value: "sms", label: "Text message", description: "+1 (555) 014-2290", icon: <DeviceMobile data-slot="icon" weight="bold" /> },
  { value: "webhook", label: "Webhook", description: "POST https://hooks.northwind.example/deploys/web-app", icon: <Link data-slot="icon" weight="bold" /> },
  { value: "inbox", label: "Workspace inbox", description: "No email, shown when you sign in", icon: <Bell data-slot="icon" weight="bold" /> },
];

export default function AlertChannels() {
  return (
    <Listbox items={channels} label="Send failed deploy alerts to" selectionMode="multiple" defaultValue={["email", "webhook"]} style={{ width: 320 }} />
  );
}
