import { EmptyState } from "@fndn/react";

/* under a filter bar: the pull request list is empty for these filters */
export default function FilterNoMatches() {
  return <EmptyState size="row" align="center" icon="funnel" title="No open pull requests by Lucas Moreau" className="w-80 max-w-full" />;
}
