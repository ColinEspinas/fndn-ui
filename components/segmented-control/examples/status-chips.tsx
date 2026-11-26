import type { ComponentProps } from "react";
import { SegmentedControl } from "@fndn/react";

/* chips: a filter row over a list, each with a status dot and a count */
type Props = ComponentProps<typeof SegmentedControl>;

const states: Props["options"] = [
  { value: "all", label: "All", count: 31 },
  { value: "open", label: "Open", dot: "green", count: 12 },
  { value: "draft", label: "Draft", dot: true, count: 4 },
  { value: "merged", label: "Merged", dot: "purple", count: 15 },
];

export default function StatusChips() {
  return <SegmentedControl variant="chips" options={states} defaultValue="open" aria-label="Pull requests by status" />;
}
