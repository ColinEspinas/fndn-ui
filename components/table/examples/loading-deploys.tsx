import { Table } from "@fndn/react";

const columns = [
  { key: "branch", label: "Branch", truncate: true },
  { key: "status", label: "Status" },
  { key: "duration", label: "Duration", numeric: true },
];

/* while the deploys load: the header and as many still placeholder rows as the page usually shows */
export default function LoadingDeploys() {
  return <Table variant="flush" aria-label="Recent deploys of web-app" columns={columns} rows={[]} loading loadingRows={3} />;
}
