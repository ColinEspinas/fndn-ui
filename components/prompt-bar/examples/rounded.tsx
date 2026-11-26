import type { ComponentProps } from "react";
import { PromptBar } from "@fndn/react";

type Props = ComponentProps<typeof PromptBar>;

const models: Props["models"] = [
  { value: "atlas-large", label: "Atlas Large", meta: "Most capable" },
  { value: "atlas-small", label: "Atlas Small", meta: "Fastest" },
  { value: "atlas-reason", label: "Atlas Reason", meta: "Thinks longer" },
];

const sources: Props["sources"] = [
  { value: "accounts", label: "Customer accounts", description: "1,284 workspaces, plans and MRR", icon: "users" },
  { value: "tickets", label: "Support tickets", description: "Open and closed, last 90 days", icon: "chat-circle" },
  { value: "metrics", label: "Product metrics", description: "Bookings, activation, churn", icon: "chart-bar" },
  { value: "web", label: "Web search", description: "Public pages and news", icon: "globe" },
];

const commands: Props["commands"] = [
  { value: "summarize", description: "Summarize this conversation" },
  { value: "draft-email", description: "Write an email to a customer" },
  { value: "query", description: "Ask the data warehouse in SQL" },
  { value: "chart", description: "Chart the last result" },
  { value: "ticket", description: "Open a support ticket" },
];

export default function Rounded() {
  return (
    <PromptBar
      shape="rounded"
      defaultValue="Which accounts renewing in December show churn risk?"
      defaultModel="atlas-large"
      models={models}
      sources={sources}
      commands={commands}
      style={{ width: 420 }}
    />
  );
}
