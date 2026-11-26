import type { ComponentProps } from "react";
import { Select } from "@fndn/react";

type Props = ComponentProps<typeof Select>;

/* meta sits at the end of each option; a long name wraps instead of being cut */
const plans: Props["items"] = [
  { value: "free", label: "Free", meta: "$0" },
  { value: "team", label: "Team", meta: "$20 / seat" },
  { value: "business", label: "Business", meta: "$45 / seat" },
  { value: "enterprise", label: "Enterprise, with SSO, audit log and an annual contract", meta: "Contact sales" },
];

export default function Plan() {
  return <Select items={plans} defaultValue="team" label="Plan" style={{ width: 260 }} />;
}
