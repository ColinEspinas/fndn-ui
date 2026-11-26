import type { ComponentProps } from "react";
import { ChatComposer } from "@fndn/react";

type Props = ComponentProps<typeof ChatComposer>;

const tabs: Props["defaultTabs"] = [
  {
    value: "deploy-482",
    label: "Deploy #482",
    messages: [
      {
        role: "user",
        text: "Why did the 14:05 deploy of harbor/web fail?",
      },
      {
        role: "agent",
        label: "CI logs",
        source: "github_actions",
        time: "6s",
        text: "The test step failed: 3 tests in booking-calendar.test.ts time out after 5,000 ms.",
      },
      {
        role: "agent",
        label: "Cause",
        source: "harbor/web",
        time: "3s",
        text: "Commit 9f2c1ab changed the slot query to /v2/availability, but the tests still mock /v1/slots.",
      },
    ],
  },
  {
    value: "refunds",
    label: "Refund queue",
    messages: [
      {
        role: "user",
        text: "Which refunds are waiting on finance?",
      },
      {
        role: "agent",
        label: "Stripe",
        source: "billing-service",
        time: "2s",
        text: "4 refunds over $500 wait for Daniel Okafor. The oldest is Kestrel Logistics, $1,240, 3 days ago.",
      },
    ],
  },
];

const suggestions = ["Roll back to #481", "Fix the mocks", "Notify #deploys"];

export default function Conversation() {
  return (
    <ChatComposer
      defaultTabs={tabs}
      defaultTab="deploy-482"
      suggestions={suggestions}
      placeholder="Ask a follow-up or tag a teammate with @"
      style={{ width: 380 }}
    />
  );
}
