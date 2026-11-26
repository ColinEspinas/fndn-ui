import { useState } from "react";
import { Checkbox } from "@fndn/react";

/* md (18px) in table rows; no visible label, so each box is named after its row */
const projects = [
  { name: "web-app", deployed: "2 min ago" },
  { name: "billing-api", deployed: "Nov 14, 2026" },
  { name: "data-pipeline", deployed: "Nov 9, 2026" },
];

export default function SelectRows() {
  const [selected, setSelected] = useState<string[]>(["billing-api"]);
  return (
    <div className="flex w-80 flex-col gap-2">
      <p className="text-xs text-ink-2" role="status">{selected.length} of {projects.length} projects selected</p>
      <table className="w-full text-sm">
        <tbody>
          {projects.map((p) => (
            <tr key={p.name}>
              <td className="w-8 py-1.5">
                <Checkbox
                  size="md"
                  aria-label={`Select ${p.name}`}
                  checked={selected.includes(p.name)}
                  onCheckedChange={(v) => setSelected(v === true ? [...selected, p.name] : selected.filter((s) => s !== p.name))}
                />
              </td>
              <td className="py-1.5 text-ink">{p.name}</td>
              <td className="py-1.5 text-end text-ink-2">{p.deployed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
