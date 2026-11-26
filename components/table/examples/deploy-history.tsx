import { Avatar, Link, StatusPill, Table } from "@fndn/react";

const columns = [
  { key: "id", label: "Deploy" },
  { key: "branch", label: "Branch" },
  { key: "status", label: "Status" },
  { key: "author", label: "Author" },
  { key: "duration", label: "Duration", numeric: true },
];

const deploys = [
  { id: "dpl_7f3a9c", branch: "main", status: "Ready", tone: "green", author: "Maya Chen", color: "var(--fndn-tag-orange)", duration: "50s" },
  { id: "dpl_8b21e4", branch: "feat/usage-alerts", status: "Building", tone: "accent", author: "Daniel Okafor", color: "var(--fndn-tag-blue)", duration: "1m 12s" },
  { id: "dpl_3c90af", branch: "fix/tax-rounding-on-annual-invoices", status: "Failed", tone: "red", author: "Priya Raman", color: "var(--fndn-tag-purple)", duration: "48s" },
  { id: "dpl_2d77b1", branch: "main", status: "Canceled", tone: "neutral", author: "Jonas Weber", color: "var(--fndn-tag-green)", duration: "6s" },
] as const;

/* the data form with rich cells: a row's value may be a node, for the columns that need more than text */
const rows = deploys.map((d) => ({
  ...d,
  id: <Link href={`/web-app/deploys/${d.id}`} className="font-mono text-xs whitespace-nowrap">{d.id}</Link>,
  status: <StatusPill tone={d.tone} size="sm">{d.status}</StatusPill>,
  author: <span className="inline-flex items-center gap-2 whitespace-nowrap"><Avatar name={d.author} color={d.color} size="20" />{d.author}</span>,
}));

export default function DeployHistory() {
  return <Table aria-label="Deploys of web-app" columns={columns} rows={rows} />;
}
