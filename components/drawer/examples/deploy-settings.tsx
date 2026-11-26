import { useState } from "react";
import { Drawer, Field, Input, Switch, type DrawerAction } from "@fndn/react";

const actions: DrawerAction[] = [
  { label: "Cancel", value: "cancel", variant: "ghost" },
  { label: "Save changes", value: "save", variant: "primary" },
];

/* a side panel keeps the page in view while you edit what is on it */
export default function DeploySettings() {
  const [branch, setBranch] = useState("main");
  const [buildCommand, setBuildCommand] = useState("pnpm build");
  const [deployOnPush, setDeployOnPush] = useState(true);
  return (
    <div className="flex w-80 items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium text-ink">Production</span>
        <span className="text-xs text-ink-2">Deploys main on every push</span>
      </div>
      <Drawer
        side="end"
        triggerLabel="Edit deploy settings"
        title="Deploy settings"
        description="web-app · Production"
        actions={actions}
      >
        <div className="flex flex-col gap-4">
          <Field label="Production branch">
            <Input value={branch} onChange={(event) => setBranch(event.target.value)} mono />
          </Field>
          <Field label="Build command" helper="Runs in the repository root.">
            <Input value={buildCommand} onChange={(event) => setBuildCommand(event.target.value)} mono />
          </Field>
          <Switch checked={deployOnPush} onCheckedChange={setDeployOnPush}>Deploy every push to main</Switch>
        </div>
      </Drawer>
    </div>
  );
}
