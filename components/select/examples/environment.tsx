import type { ComponentProps } from "react";
import { Select } from "@fndn/react";

type Props = ComponentProps<typeof Select>;

const environments: Props["items"] = [
  { value: "production", label: "Production", meta: "main" },
  { value: "staging", label: "Staging", meta: "release/2026.11" },
  { value: "preview", label: "Preview", meta: "feat/usage-alerts" },
];

export default function Environment() {
  return (
    <Select
      items={environments}
      defaultValue="staging"
      placeholder="Choose an environment"
      label="Deploy to"
      style={{ width: 240 }}
    />
  );
}
