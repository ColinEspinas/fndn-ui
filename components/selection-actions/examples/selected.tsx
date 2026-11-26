import type { ComponentProps } from "react";
import { SelectionActions } from "@fndn/react";

type Props = ComponentProps<typeof SelectionActions>;

const actions: Props["actions"] = [
  { value: "explain", label: "Explain", icon: "question" },
  {
    value: "improve",
    label: "Improve",
    icon: "sparkle",
    busyLabel: "Improving",
  },
  {
    value: "shorten",
    label: "Shorten",
    icon: "corners-in",
    busyLabel: "Shortening",
  },
  {
    value: "tone",
    label: "Tone",
    icon: "chat-text",
    busyLabel: "Changing tone",
  },
];

export default function Selected() {
  return (
    <SelectionActions
      defaultText="Thanks for flagging this, and sorry for the confusion on Monday. Reminders scheduled before 6 a.m. were going out an hour late after the daylight saving change, and we shipped a fix this morning."
      defaultSelection={{ start: 65, end: 195 }}
      defaultOpen
      actions={actions}
      style={{ width: 420 }}
    />
  );
}
