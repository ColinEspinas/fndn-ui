import { Card, EmptyState } from "@fndn/react";

/* the search palette when nothing matches the query */
export default function SearchNoResults() {
  return (
    <Card elevation="overlay" className="w-[300px] max-w-full">
      <EmptyState size="block" icon="magnifying-glass" title="No results for “billing-apy”" hint="Check the spelling, or search by project, person or deploy ID." />
    </Card>
  );
}
