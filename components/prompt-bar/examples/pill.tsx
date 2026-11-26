import type { ComponentProps } from "react";
import { PromptBar } from "@fndn/react";

type Props = ComponentProps<typeof PromptBar>;

const models: Props["models"] = [
  { value: "atlas-large", label: "Atlas Large", meta: "Most capable" },
  { value: "atlas-small", label: "Atlas Small", meta: "Fastest" },
];

const sources: Props["sources"] = [
  { value: "accounts", label: "Customer accounts", description: "1,284 workspaces, plans and MRR", icon: "users" },
  { value: "tickets", label: "Support tickets", description: "Open and closed, last 90 days", icon: "chat-circle" },
  { value: "metrics", label: "Product metrics", description: "Bookings, activation, churn", icon: "chart-bar" },
];

export default function Pill() {
  return (
    <PromptBar
      shape="pill"
      busy
      defaultValue="Summarize this week's tickets from Juniper Health"
      defaultModel="atlas-small"
      models={models}
      sources={sources}
      style={{ width: 420 }}
    />
  );
}
