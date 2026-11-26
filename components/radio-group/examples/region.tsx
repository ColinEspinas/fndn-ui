import type { ComponentProps } from "react";
import { RadioGroup } from "@fndn/react";

/* no default when there is no safe guess: nothing is picked until someone chooses */
type Props = ComponentProps<typeof RadioGroup>;

const regions: Props["items"] = [
  { value: "us-east", label: "US East (Virginia)" },
  { value: "eu-west", label: "EU West (Frankfurt)" },
  { value: "ap-northeast", label: "Asia Pacific (Tokyo)" },
];

export default function Region() {
  return <RadioGroup name="region" label="Region for data-pipeline" items={regions} defaultValue={null} />;
}
