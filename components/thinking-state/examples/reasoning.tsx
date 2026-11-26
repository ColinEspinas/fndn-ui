import type { ComponentProps } from "react";
import { ThinkingState } from "@fndn/react";

type Props = ComponentProps<typeof ThinkingState>;

const rows: Props["rows"] = [
  {
    primary: "Errors on harbor/api rose from 0.2% to 4.1% right after the 14:05 deploy, and every failing request hits /v2/availability.",
  },
  {
    primary: "Rolling back to #481 is safe: migration 0142 only adds a nullable column, so the previous build still reads the bookings table.",
  },
];

export default function Reasoning() {
  return (
    <ThinkingState
      variant="reasoning"
      defaultExpanded
      doneLabel="Thought for 6 seconds"
      rows={rows}
    />
  );
}
