import { Editable } from "@fndn/react";

/* controls: Edit, Save and Cancel buttons for people who do not guess the double-click */
export default function ReleaseTitle() {
  return (
    <Editable
      label="Release title"
      defaultValue="v2.14: usage alerts and invoice fixes"
      controls
      activationMode="dblclick"
      style={{ width: 340 }}
    />
  );
}
