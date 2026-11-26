import { ApprovalCard, type ApprovalAction } from "@fndn/react";

const action: ApprovalAction = {
  title: "Run the database migration on Production?",
  description: "Adds the usage_alerts table and backfills it from the last 30 days of events.",
  command: "pnpm --filter billing-api db:migrate --env production",
  details: [
    { label: "Branch", value: "feat/usage-alerts", mono: true },
    { label: "Rows affected", value: "1,284" },
  ],
};

export default function ApproveCommand() {
  return <ApprovalCard action={action} alwaysAllow />;
}
