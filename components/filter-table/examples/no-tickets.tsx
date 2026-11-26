import type { ComponentProps } from "react";
import { FilterTable } from "@fndn/react";

type Props = ComponentProps<typeof FilterTable>;

const labels: Props["labels"] = {
  filters: "Filter tickets by status",
  region: "Support tickets",
  empty: "No tickets with this status",
  none: "No tickets yet. New requests from customers land here.",
  columns: { task: "Ticket", owner: "Customer" },
  statuses: { todo: "Open", progress: "Pending", done: "Solved" },
};

export default function NoTickets() {
  return <FilterTable rows={[]} labels={labels} />;
}
