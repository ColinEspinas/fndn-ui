import { useState } from "react";
import { DatePicker } from "@fndn/react";

export default function ReleaseDate() {
  const [dates, setDates] = useState<string[]>([]);
  return (
    <div className="flex flex-col gap-2" style={{ width: 220 }}>
      <DatePicker label="Release date" value={dates} onValueChange={setDates} defaultFocusedValue="2026-12-01" />
      <span className="text-sm text-ink-2">{dates[0] ? `Saved as ${dates[0]}` : "Not scheduled yet"}</span>
    </div>
  );
}
