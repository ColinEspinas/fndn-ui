import type { ComponentProps } from "react";
import { useState } from "react";
import { Button, RecordsTable } from "@fndn/react";

type Props = ComponentProps<typeof RecordsTable>;

const columns: Props["columns"] = [
  { key: "company", label: "Company", width: 190 },
  { key: "plan", label: "Plan", width: 100 },
  { key: "seats", label: "Seats", type: "number", width: 90 },
];

const rows: Props["rows"] = [
  { id: "brightline", company: "Brightline Dental", plan: "Business", seats: 48 },
  { id: "kestrel", company: "Kestrel Logistics", plan: "Team", seats: 112 },
  { id: "juniper", company: "Juniper Health", plan: "Enterprise", seats: 1240 },
];

/* a click (or Enter) on a row opens the account; the checkbox stays its own target, and the
 * selection bar carries what can be done to every selected account */
export default function OpenAndBulk() {
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2" style={{ width: 400 }}>
      <RecordsTable
        columns={columns}
        rows={rows}
        onRowOpen={setOpened}
        selectionActions={(selected) => (
          <Button variant="ghost" size="sm" onClick={() => setOpened(`${selected.length} exported`)}>Export</Button>
        )}
      />
      <p className="text-sm text-ink-2" role="status">{opened ? `Opened: ${opened}` : "Click a row to open it"}</p>
    </div>
  );
}
