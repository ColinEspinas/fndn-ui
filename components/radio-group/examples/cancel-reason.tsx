import type { ComponentProps } from "react";
import { RadioGroup } from "@fndn/react";

/* rows: a list of answers under one highlight, with a free-text row for anything else */
type Props = ComponentProps<typeof RadioGroup>;

const reasons: Props["items"] = [
  { value: "price", label: "Too expensive for our team" },
  { value: "feature", label: "Missing a feature we need" },
  { value: "switching", label: "Moving to another tool" },
];

export default function CancelReason() {
  return (
    <RadioGroup
      name="reason"
      label="Why are you cancelling the Team plan?"
      layout="row"
      items={reasons}
      customPlaceholder="Something else…"
      customLabel="Another reason"
      customEnterKeyHint="send"
      className="w-80"
    />
  );
}
