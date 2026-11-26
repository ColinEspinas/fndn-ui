import { useState } from "react";
import { ButtonGroup } from "@fndn/react";

/* buttons from data: one handler gets the value of the button pressed */
const formats = [
  { value: "csv", label: "CSV" },
  { value: "json", label: "JSON" },
  { value: "pdf", label: "PDF" },
];

export default function ExportUsage() {
  const [file, setFile] = useState("");
  return (
    <div className="flex flex-col items-start gap-2">
      <ButtonGroup label="Export usage as" size="sm" items={formats} onItemClick={(format) => setFile(`usage-nov-2026.${format}`)} />
      <p className="text-sm text-ink-2" role="status">{file ? `Preparing ${file}…` : "Usage for Nov 1 – Nov 14, 2026"}</p>
    </div>
  );
}
