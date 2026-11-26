import type { ComponentProps } from "react";
import { ChatComposer } from "@fndn/react";

type Props = ComponentProps<typeof ChatComposer>;

const tabs: Props["defaultTabs"] = [
  {
    value: "incident",
    label: "API latency",
    messages: [
      {
        role: "user",
        text: "p95 latency on harbor/api doubled at 09:40. What changed?",
      },
    ],
  },
  {
    value: "deploy-482",
    label: "Deploy #482",
  },
];

const suggestions = ["Compare with yesterday", "Open the dashboard"];

export default function Busy() {
  return (
    <ChatComposer
      defaultTabs={tabs}
      defaultTab="incident"
      busy
      status="Reading the request logs"
      suggestions={suggestions}
      style={{ width: 380 }}
    />
  );
}
