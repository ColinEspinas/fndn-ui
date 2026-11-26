import { useState } from "react";
import { Checkbox } from "@fndn/react";

/* select all: checked when every child is, indeterminate when some are */
const ENVIRONMENTS = ["Production", "Staging", "Preview"];

export default function SelectEnvironments() {
  const [picked, setPicked] = useState<string[]>(["Production"]);
  const all = picked.length === ENVIRONMENTS.length ? true : picked.length ? "indeterminate" : false;
  const toggle = (env: string, on: boolean) => setPicked(on ? [...picked, env] : picked.filter((p) => p !== env));
  return (
    <div className="flex flex-col gap-2.5">
      <Checkbox label="Redeploy in all environments" checked={all} onCheckedChange={(v) => setPicked(v === true ? ENVIRONMENTS : [])} />
      <div className="flex flex-col gap-2.5 ps-6">
        {ENVIRONMENTS.map((env) => (
          <Checkbox key={env} label={env} checked={picked.includes(env)} onCheckedChange={(v) => toggle(env, v === true)} />
        ))}
      </div>
    </div>
  );
}
