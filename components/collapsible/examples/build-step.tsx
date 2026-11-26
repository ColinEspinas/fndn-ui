import { Collapsible } from "@fndn/react";

export default function BuildStep() {
  return (
    <Collapsible
      variant="row"
      defaultOpen
      label="Build"
      meta="48s"
      detail="Installed 1,284 packages, compiled 312 modules and uploaded 14.2 MB of assets for dpl_7f3a9c."
      style={{ width: 320 }}
    />
  );
}
