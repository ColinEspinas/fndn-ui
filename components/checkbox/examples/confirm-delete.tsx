import { useState } from "react";
import { Button, Checkbox } from "@fndn/react";

/* invalid until confirmed: the error says what to do, the action waits for it */
export default function ConfirmDelete() {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="flex w-80 flex-col items-start gap-3">
      <div className="flex flex-col gap-1">
        <Checkbox
          label="I understand that billing-api and its 128 deploys are deleted for good"
          checked={confirmed}
          onCheckedChange={(v) => setConfirmed(v === true)}
          invalid={!confirmed}
        />
        {!confirmed && <p className="ps-6 text-xs text-red">Confirm to delete the project.</p>}
      </div>
      <Button variant="danger" size="sm" disabled={!confirmed}>Delete billing-api</Button>
    </div>
  );
}
