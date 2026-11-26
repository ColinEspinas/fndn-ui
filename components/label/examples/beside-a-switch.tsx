import { Label, Switch } from "@fndn/react";

/* a settings row: the label names the switch (a click on it toggles), the description sits under it */
export default function BesideASwitch() {
  return (
    <div className="flex w-full max-w-80 items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Label htmlFor="preview-deploys">Preview deploys</Label>
        <p id="preview-deploys-description" className="m-0 text-sm text-ink-2">Build every pull request on its own URL.</p>
      </div>
      <Switch id="preview-deploys" aria-describedby="preview-deploys-description" defaultChecked />
    </div>
  );
}
