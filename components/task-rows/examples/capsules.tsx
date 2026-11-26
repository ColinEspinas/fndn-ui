import { TaskRows, type TaskRow } from "@fndn/react";

const rows: TaskRow[] = [
  {
    key: "tests",
    label: "Ran the test suite",
    amount: "412 tests",
    status: "done",
    details: [
      { label: "Unit tests", meta: "388/388" },
      { label: "Playwright smoke tests", meta: "24/24" },
    ],
  },
  {
    key: "preview",
    label: "Deployed the preview of harbor/web",
    amount: "2m 14s",
    status: "done",
    details: [
      { label: "Compiled 1,284 modules", meta: "48s" },
      { label: "Uploaded assets", meta: "18.2 MB" },
    ],
  },
  {
    key: "notes",
    label: "Writing the release notes",
    amount: "23 PRs",
    status: "running",
    step: 3,
    details: [
      { label: "Grouped merged pull requests", meta: "23" },
      { label: "Drafting the summary", meta: "2 of 4" },
    ],
  },
];

export default function Capsules() {
  return <TaskRows rows={rows} defaultOpen={["notes"]} />;
}
