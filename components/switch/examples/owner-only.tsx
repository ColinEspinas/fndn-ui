import { Switch } from "@fndn/react";

/* disabled keeps its state readable and says who can change it */
export default function OwnerOnly() {
  return (
    <div className="flex max-w-80 flex-col gap-2">
      <Switch checked disabled aria-describedby="two-factor-help">
        Require two-factor authentication
      </Switch>
      <p id="two-factor-help" className="text-sm text-ink-2">Only Maya Chen, the workspace owner, can change this.</p>
    </div>
  );
}
