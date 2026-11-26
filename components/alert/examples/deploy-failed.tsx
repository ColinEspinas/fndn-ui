import { useState } from "react";
import { Alert, type AlertAction } from "@fndn/react";

const actions: AlertAction[] = [
  { label: "Redeploy", value: "redeploy" },
  { label: "Dismiss", value: "dismiss", variant: "ghost" },
];

export default function DeployFailed() {
  const [state, setState] = useState<"failed" | "redeploying" | "dismissed">("failed");
  if (state === "dismissed") return null;
  if (state === "redeploying") {
    return (
      <Alert className="w-full max-w-[420px]" tone="accent" title="Redeploying web-app">
        Started again from commit a1b2c3d on main.
      </Alert>
    );
  }
  return (
    <Alert
      className="w-full max-w-[420px]"
      tone="red"
      title="Deploy to Production failed"
      actions={actions}
      onAction={(value) => setState(value === "redeploy" ? "redeploying" : "dismissed")}
    >
      The build of dpl_7f3a9c exited with code 1. The previous deploy is still live.
    </Alert>
  );
}
