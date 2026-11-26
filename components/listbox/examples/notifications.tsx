import { Listbox } from "@fndn/react";

const events = [
  { value: "deploy-failed", label: "A deploy fails" },
  { value: "deploy-ready", label: "A production deploy is ready" },
  { value: "review", label: "Someone requests my review" },
  { value: "invoice", label: "An invoice is paid" },
  { value: "seats", label: "The workspace runs out of seats" },
];

export default function Notifications() {
  return (
    <Listbox items={events} label="Email me when" selectionMode="multiple" defaultValue={["deploy-failed", "review"]} style={{ width: 280 }} />
  );
}
