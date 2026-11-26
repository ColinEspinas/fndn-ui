import { Button } from "@fndn/react";

/* disabled says why next to it: a disabled button alone gives no reason */
export default function OwnersOnly() {
  return (
    <div className="flex max-w-80 flex-col items-start gap-2">
      <Button disabled aria-describedby="transfer-why">Transfer project</Button>
      <p id="transfer-why" className="text-sm text-ink-2">Only Maya Chen, the workspace owner, can transfer projects.</p>
    </div>
  );
}
