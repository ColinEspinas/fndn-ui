import { useState } from "react";
import { Switch } from "@fndn/react";

/* a settings row: name and effect at the start, the switch at the end; it applies at once */
export default function DeployOnPush() {
  const [enabled, setEnabled] = useState(true);
  return (
    <div className="flex w-80 items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <p id="deploy-on-push" className="text-sm font-medium text-ink">Deploy on push</p>
        <p id="deploy-on-push-help" className="text-sm text-ink-2">
          {enabled ? "Every push to main deploys web-app to Production." : "Deploy web-app by hand from the Deploys tab."}
        </p>
      </div>
      <Switch checked={enabled} onCheckedChange={setEnabled} aria-labelledby="deploy-on-push" aria-describedby="deploy-on-push-help" />
    </div>
  );
}
