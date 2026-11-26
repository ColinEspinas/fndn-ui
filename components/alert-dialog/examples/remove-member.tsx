import { useState } from "react";
import { AlertDialog, Checkbox } from "@fndn/react";

/* a body under the description: one choice that changes what the action does */
export default function RemoveMember() {
  const [reassign, setReassign] = useState(true);
  return (
    <AlertDialog
      triggerLabel="Remove member"
      title="Remove Daniel Okafor from Northwind?"
      description="Daniel loses access to every project at once. Their deploys and comments stay."
      actionLabel="Remove member"
    >
      <Checkbox
        label="Reassign Daniel's 12 open reviews to me"
        checked={reassign}
        onCheckedChange={(checked) => setReassign(checked === true)}
      />
    </AlertDialog>
  );
}
