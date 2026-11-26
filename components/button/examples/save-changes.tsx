import { Button } from "@fndn/react";

/* a form footer: the primary action last, Cancel before it */
export default function SaveChanges() {
  return (
    <div className="inline-flex items-center gap-2">
      <Button>Cancel</Button>
      <Button variant="primary">Save changes</Button>
    </div>
  );
}
