import { FilterTable, type FilterTableColumn, type FilterTableFilter } from "@fndn/react";

const columns: FilterTableColumn[] = [
  { key: "commit", label: "Commit", type: "title" },
  { key: "env", label: "Environment", type: "tag" },
  { key: "author", label: "Author", type: "text" },
  { key: "duration", label: "Duration", type: "number" },
];

/* the chips match the env field; an environment is a label, not a status, so the column is a tag column and each chip's tone colours its dot and the rows' tags */
const filters: FilterTableFilter[] = [
  { key: "all", label: "All" },
  { key: "production", label: "Production", tone: "green" },
  { key: "staging", label: "Staging", tone: "orange" },
  { key: "preview", label: "Preview", tone: "blue" },
];

const rows = [
  { commit: "a1b2c3d Add retry to webhook delivery", env: "production", author: "Priya Raman", duration: "50s" },
  { commit: "9f8e7d6 Usage alerts behind a flag", env: "staging", author: "Daniel Okafor", duration: "1m 12s" },
  { commit: "4c5d6e7 Preview of the new billing page", env: "preview", author: "Aiko Tanaka", duration: "48s" },
  { commit: "0a9b8c7 Fix tax rounding", env: "production", author: "Jonas Weber", duration: "41s" },
];

const labels = { filters: "Filter deploys by environment", region: "Deploys of web-app", empty: "No deploys in this environment", none: "No deploys yet" };

export default function DeploysByEnvironment() {
  return <FilterTable className="max-w-[520px]" columns={columns} filters={filters} filterKey="env" rows={rows} labels={labels} />;
}
