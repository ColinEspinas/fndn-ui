import type { ComponentProps } from "react";
import { PromptBar } from "@fndn/react";

type Props = ComponentProps<typeof PromptBar>;

const models: Props["models"] = [
  { value: "atlas-large", label: "Atlas Large", meta: "Most capable" },
  { value: "atlas-small", label: "Atlas Small", meta: "Fastest" },
];

const sources: Props["sources"] = [
  { value: "billing", label: "Billing", description: "Invoices, refunds and payouts", icon: "database" },
  { value: "accounts", label: "Customer accounts", description: "1,284 workspaces, plans and MRR", icon: "users" },
];

const attachments = ["INV-0117.pdf", "payouts-2024-10.csv", "kestrel-logistics-master-services-agreement.pdf"];

export default function WithAttachments() {
  return (
    <PromptBar
      shape="rounded"
      defaultValue="Check these invoices against the October payouts and flag any mismatch"
      defaultAttachments={attachments}
      defaultModel="atlas-large"
      models={models}
      sources={sources}
      style={{ width: 420 }}
    />
  );
}
