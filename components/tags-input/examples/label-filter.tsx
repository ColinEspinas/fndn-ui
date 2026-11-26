import { useState } from "react";
import { Button, TagsInput } from "@fndn/react";

/* sm: 28px, beside an sm Button in a list's toolbar */
export default function LabelFilter() {
  const [labels, setLabels] = useState<string[]>(["bug", "p1"]);
  return (
    <div className="flex items-center gap-2" style={{ width: 320 }}>
      <TagsInput size="sm" aria-label="Filter by label" value={labels} onValueChange={setLabels} placeholder="Label" className="min-w-0 flex-1" />
      <Button size="sm" variant="secondary" disabled={labels.length === 0} onClick={() => setLabels([])}>Clear</Button>
    </div>
  );
}
