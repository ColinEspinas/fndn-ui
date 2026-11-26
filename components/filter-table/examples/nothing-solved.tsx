import type { ComponentProps } from "react";
import { FilterTable } from "@fndn/react";

type Props = ComponentProps<typeof FilterTable>;

const rows: Props["rows"] = [
  {
    task: "Reminder SMS sent twice for the same booking",
    date: "Nov 16",
    status: "todo",
    owner: "Brightline Dental",
  },
  {
    task: "Calendar sync stopped after Google re-auth",
    date: "Nov 15",
    status: "progress",
    owner: "Kestrel Logistics",
  },
  {
    task: "Can't export invoices as CSV",
    date: "Nov 14",
    status: "todo",
    owner: "Juniper Health",
  },
];

const labels: Props["labels"] = {
  filters: "Filter tickets by status",
  region: "Support tickets",
  empty: "Nothing solved yet this week",
  none: "No tickets yet",
  columns: { task: "Ticket", owner: "Customer" },
  statuses: { todo: "Open", progress: "Pending", done: "Solved" },
};

export default function NothingSolved() {
  return <FilterTable rows={rows} labels={labels} defaultFilter="done" />;
}
