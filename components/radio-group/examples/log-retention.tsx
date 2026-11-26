import type { ComponentProps } from "react";
import { RadioGroup } from "@fndn/react";

/* an option the plan does not include stays in the list, disabled, and says why */
type Props = ComponentProps<typeof RadioGroup>;

const retention: Props["items"] = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "365", label: "1 year (Business plan)", disabled: true },
];

export default function LogRetention() {
  return <RadioGroup name="retention" label="Keep deploy logs for" items={retention} defaultValue="30" />;
}
