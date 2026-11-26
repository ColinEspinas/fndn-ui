import { Search } from "@fndn/react";

const items = ["web-app", "billing-api", "mobile", "docs-site", "data-pipeline"];

export default function NoResults() {
  return (
    <Search
      className="w-80"
      items={items}
      defaultQuery="kubernetes"
      label="Search projects"
      placeholder="Search projects…"
      emptyTitle="No projects match"
      emptyHint="Search by project name, like web-app"
    />
  );
}
