import { useState } from "react";
import { Button, Tag } from "@fndn/react";

const initial = ["Status: Failed", "Branch: main", "Project: billing-api"];

export default function AppliedFilters() {
  const [filters, setFilters] = useState(initial);
  return (
    <div className="flex w-80 flex-wrap items-center gap-1.5 text-sm">
      {filters.map((filter) => (
        <Tag key={filter} removable removeLabel={`Remove ${filter}`} onRemove={() => setFilters(filters.filter((f) => f !== filter))}>
          {filter}
        </Tag>
      ))}
      {filters.length ? (
        <Button size="xs" variant="ghost" onClick={() => setFilters([])}>Clear all</Button>
      ) : (
        <Button size="xs" variant="ghost" onClick={() => setFilters(initial)}>Restore filters</Button>
      )}
    </div>
  );
}
