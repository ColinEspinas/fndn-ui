import { Collapsible } from "@fndn/react";

export default function LockedForViewers() {
  return (
    <Collapsible
      variant="row"
      disabled
      label="Environment variables"
      meta="Admins only"
      detail="12 variables for Production, Staging and Preview."
      style={{ width: 320 }}
    />
  );
}
