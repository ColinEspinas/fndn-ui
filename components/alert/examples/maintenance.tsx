import { Alert } from "@fndn/react";

/* part of the page from the start: role none, so it is not announced */
export default function Maintenance() {
  return (
    <Alert className="w-full max-w-[420px]" role="none" title="Scheduled maintenance on Nov 21">
      Deploys are paused from 02:00 to 03:00 UTC. Live sites stay up.
    </Alert>
  );
}
