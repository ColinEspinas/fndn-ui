import type { ComponentProps } from "react";
import { ThinkingState } from "@fndn/react";

type Props = ComponentProps<typeof ThinkingState>;

const rows: Props["rows"] = [
  { primary: "Read", secondary: "src/booking/availability.test.ts", mono: true },
  {
    primary: "Edit",
    secondary: "src/booking/availability.ts",
    mono: true,
    add: 18,
    del: 6,
  },
  { primary: "Run", secondary: "pnpm test availability", mono: true },
];

export default function Coding() {
  return (
    <ThinkingState
      variant="coding"
      defaultExpanded
      defaultSelected={1}
      doneLabel="Ran 3 tools"
      rows={rows}
    />
  );
}
