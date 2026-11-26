import type { ComponentProps } from "react";
import { Flowchart } from "@fndn/react";

type Props = ComponentProps<typeof Flowchart>;

const triggers: Props["triggers"] = [
  {
    value: "workspace-created",
    label: "Workspace created",
    caption: "Runs when a customer signs up",
  },
  {
    value: "trial-ending",
    label: "Trial ends in 3 days",
    caption: "Runs three days before a trial ends",
  },
  {
    value: "first-booking",
    label: "First booking made",
    caption: "Runs on a workspace's first booking",
  },
];

const properties: Props["properties"] = [
  { value: "plan", label: "plan" },
  { value: "industry", label: "industry" },
  { value: "team-size", label: "team size" },
  { value: "source", label: "signup source" },
];

const choices: Props["choices"] = {
  plan: [
    { value: "starter", label: "Starter", meta: "$19 / seat" },
    { value: "team", label: "Team", meta: "$49 / seat" },
    { value: "business", label: "Business", meta: "$99 / seat" },
    { value: "enterprise", label: "Enterprise", meta: "Custom" },
  ],
  industry: [
    { value: "dental", label: "Dental" },
    { value: "healthcare", label: "Healthcare" },
    { value: "logistics", label: "Logistics" },
    { value: "real-estate", label: "Real estate" },
  ],
  "team-size": [
    { value: "1-5", label: "1–5 people" },
    { value: "6-25", label: "6–25 people" },
    { value: "26-100", label: "26–100 people" },
    { value: "100+", label: "More than 100" },
  ],
  source: [
    { value: "search", label: "Search" },
    { value: "referral", label: "Customer referral" },
    { value: "partner", label: "Partner: Dental Association of Oregon" },
  ],
};

const conditions: Props["defaultConditions"] = [
  { id: "c1", property: "plan", value: "business" },
  { id: "c2", property: "industry", value: "dental" },
  { id: "c3", property: "team-size", value: "26-100" },
  { id: "c4", property: "source", value: "partner" },
];

export default function GuidedSetupForDentalGroups() {
  return (
    <Flowchart
      triggers={triggers}
      defaultTrigger="workspace-created"
      source="workspace"
      properties={properties}
      choices={choices}
      defaultConditions={conditions}
      style={{ width: 420 }}
    />
  );
}
