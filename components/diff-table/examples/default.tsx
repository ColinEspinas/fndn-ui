import type { ComponentProps } from "react";
import { DiffTable } from "@fndn/react";

type Props = ComponentProps<typeof DiffTable>;

const columns: Props["columns"] = ["Plan", "Billing", "Price"];

const rows: Props["rows"] = [
  {
    key: "team-49",
    name: "Team",
    category: "Monthly",
    tone: "accent",
    value: "$49 per seat",
    change: "removed",
  },
  {
    key: "team-59",
    name: "Team",
    category: "Monthly",
    tone: "accent",
    value: "$59 per seat",
    change: "added",
  },
  {
    key: "business",
    name: "Business",
    category: "Monthly",
    tone: "accent",
    value: "$99 per seat",
    change: "unchanged",
  },
];

export default function ProposedPriceChanges() {
  return <DiffTable title="Proposed price changes" columns={columns} rows={rows} />;
}
