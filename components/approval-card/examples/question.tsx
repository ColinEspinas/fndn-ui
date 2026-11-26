import type { ComponentProps } from "react";
import { ApprovalCard } from "@fndn/react";

type Props = ComponentProps<typeof ApprovalCard>;

const questions: Props["questions"] = [
  {
    q: "When should I migrate the bookings table (2.4M rows)?",
    type: "radio",
    options: [
      "Now, with a 40-second write lock",
      "Tonight at 02:00 UTC, the quietest hour",
      "Online in batches, about 25 minutes",
    ],
  },
  {
    q: "Where should it run first?",
    type: "check",
    options: ["Staging", "EU production", "US production"],
  },
  {
    q: "If a health check fails afterwards, what should I do?",
    type: "radio",
    options: [
      "Roll back automatically",
      "Pause and page Maya Chen",
      "Keep going and log it",
    ],
  },
];

export default function Question() {
  return <ApprovalCard questions={questions} defaultIndex={0} />;
}
