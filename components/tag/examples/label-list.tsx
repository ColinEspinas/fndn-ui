import { Count, Tag } from "@fndn/react";

const labels = [
  { name: "bug", tone: "red", open: 14 },
  { name: "feature", tone: "green", open: 32 },
  { name: "docs", tone: "blue", open: 6 },
] as const;

/* a dot carries the hue where the label stands on its own */
export default function LabelList() {
  return (
    <ul className="flex w-48 flex-col gap-1.5 text-sm">
      {labels.map((label) => (
        <li key={label.name} className="flex items-center justify-between gap-3">
          <Tag tone={label.tone} dot>{label.name}</Tag>
          <Count>{label.open}</Count>
        </li>
      ))}
    </ul>
  );
}
