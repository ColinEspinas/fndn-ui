import type { ComponentProps } from "react";
import { RadioGroup } from "@fndn/react";

/* exactly one of a short list, all visible at once */
type Props = ComponentProps<typeof RadioGroup>;

const visibility: Props["items"] = [
  { value: "private", label: "Private: only members of web-app" },
  { value: "internal", label: "Internal: everyone at Northwind" },
  { value: "public", label: "Public: anyone with the link" },
];

export default function ProjectVisibility() {
  return <RadioGroup name="visibility" label="Who can see web-app" items={visibility} defaultValue="internal" />;
}
