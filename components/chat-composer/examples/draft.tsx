import type { ComponentProps } from "react";
import { ChatComposer } from "@fndn/react";

type Props = ComponentProps<typeof ChatComposer>;

const tabs: Props["defaultTabs"] = [
  {
    value: "new",
    label: "New chat",
  },
];

const suggestions = ["Summarize today's tickets", "Find accounts at risk"];

export default function Draft() {
  return (
    <ChatComposer
      defaultTabs={tabs}
      defaultValue="Draft a reply to Brightline Dental about the double-booked Tuesday slots"
      suggestions={suggestions}
      style={{ width: 380 }}
    />
  );
}
