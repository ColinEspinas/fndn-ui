import { useState } from "react";
import { Button, Count } from "@fndn/react";

const filters = [
  { value: "open", label: "Open", count: "28" },
  { value: "merged", label: "Merged", count: "1,204" },
  { value: "closed", label: "Closed", count: "96" },
];

/* inside a pressed control the count takes the selected look by itself */
export default function PullRequestFilters() {
  const [filter, setFilter] = useState("open");
  return (
    <div className="flex gap-1">
      {filters.map((f) => (
        <Button key={f.value} size="sm" variant={filter === f.value ? "outline" : "ghost"} aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>
          {f.label} <Count variant="boxed">{f.count}</Count>
        </Button>
      ))}
    </div>
  );
}
