import type { ComponentProps } from "react";
import { FineTuneCard } from "@fndn/react";

type Props = ComponentProps<typeof FineTuneCard>;

const fields: Props["fields"] = [
  { key: "width", label: "W", value: 320, min: 200, max: 640 },
  { key: "height", label: "H", value: 440, min: 240, max: 960 },
  { key: "radius", label: "Radius", value: 16, min: 0, max: 48 },
  { key: "gap", label: "Gap", value: 24, min: 0, max: 64 },
];

const plans = ["Starter", "Team", "Business"];

const labels = { title: "Pricing card", type: "Plan", placeholder: "Select plan" };

export default function Edited() {
  return (
    <FineTuneCard
      fields={fields}
      types={plans}
      labels={labels}
      defaultLayout="grid"
      defaultValues={{ width: 360, radius: 12 }}
      defaultType="Business"
    />
  );
}
