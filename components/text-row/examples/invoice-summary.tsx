import { TextRow } from "@fndn/react";

const lines = [
  { label: "Team plan", value: "$240.00", meta: "12 seats" },
  { label: "Extra build minutes", value: "$18.00", meta: "1,200 min" },
  { label: "Total for November", value: "$258.00" },
];

export default function InvoiceSummary() {
  return (
    <div className="flex w-80 flex-col divide-y divide-line">
      {lines.map((line) => (
        <TextRow key={line.label} label={line.label} value={line.value} meta={line.meta} />
      ))}
    </div>
  );
}
