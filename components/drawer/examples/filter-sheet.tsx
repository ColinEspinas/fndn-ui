import { useState } from "react";
import { Drawer, Select, Switch, type DrawerAction } from "@fndn/react";

const allEnvironments = "All environments";
const anyStatus = "Any status";
const environments = [allEnvironments, "Production", "Staging", "Preview"];
const statuses = [anyStatus, "Ready", "Building", "Failed"];

const actions: DrawerAction[] = [
  { label: "Reset", value: "reset", variant: "ghost", close: false },
  { label: "Show 24 deploys", value: "apply", variant: "primary" },
];

/* on a phone, filters come up from the bottom; Reset keeps the sheet open */
export default function FilterSheet() {
  const [environment, setEnvironment] = useState("Production");
  const [status, setStatus] = useState(anyStatus);
  const [mine, setMine] = useState(false);
  const reset = (value: string) => {
    if (value !== "reset") return;
    setEnvironment(allEnvironments);
    setStatus(anyStatus);
    setMine(false);
  };
  return (
    <div className="flex w-80 items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium text-ink">Deploys</span>
        <span className="text-xs text-ink-2">Production · last 7 days</span>
      </div>
      <Drawer side="bottom" triggerLabel="Filters" title="Filter deploys" actions={actions} onAction={reset}>
        <div className="flex flex-col gap-4">
          <Select label="Environment" items={environments} value={environment} onValueChange={(value) => setEnvironment(value ?? allEnvironments)} />
          <Select label="Status" items={statuses} value={status} onValueChange={(value) => setStatus(value ?? anyStatus)} />
          <Switch checked={mine} onCheckedChange={setMine}>Only deploys I started</Switch>
        </div>
      </Drawer>
    </div>
  );
}
