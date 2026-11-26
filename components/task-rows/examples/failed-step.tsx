import { TaskRows, type TaskRow } from "@fndn/react";

const rows: TaskRow[] = [
  {
    key: "patients",
    label: "Imported patient records",
    amount: "4,812 records",
    status: "done",
    details: [
      { label: "patients-2026.csv", meta: "4,812" },
      { label: "Duplicates merged", meta: "26" },
    ],
  },
  {
    key: "providers",
    label: "Matched providers to calendars",
    amount: "14 providers",
    status: "done",
    details: [{ label: "Matched by email", meta: "12" }, { label: "Matched by name", meta: "2" }],
  },
  {
    key: "appointments",
    label: "Import upcoming appointments",
    amount: "2 files",
    status: "failed",
    details: [
      { label: "appointments-q1.csv: unknown provider P-0193", meta: "row 1,904" },
      { label: "appointments-q2.csv", meta: "not started" },
    ],
  },
];

export default function FailedStep() {
  return <TaskRows rows={rows} defaultOpen={["appointments"]} />;
}
