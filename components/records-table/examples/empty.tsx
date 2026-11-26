import type { ComponentProps } from "react";
import { RecordsTable } from "@fndn/react";

type Props = ComponentProps<typeof RecordsTable>;

const columns: Props["columns"] = [
  { key: "company", label: "Company", width: 190 },
  { key: "plan", label: "Plan", width: 100 },
  { key: "seats", label: "Seats", type: "number", width: 90 },
  {
    key: "health",
    label: "Health",
    type: "status",
    width: 130,
    options: [
      { value: "at-risk", label: "At risk", tone: "red" },
      { value: "declining", label: "Declining", tone: "orange" },
      { value: "healthy", label: "Healthy", tone: "green" },
      { value: "onboarding", label: "Onboarding", tone: "neutral" },
    ],
  },
];

const labels: Props["labels"] = { empty: "No accounts at risk this week" };

export default function NoAccountsAtRisk() {
  return <RecordsTable columns={columns} rows={[]} labels={labels} style={{ width: 560 }} />;
}
