import { useState } from "react";
import { Dialog, Field, Input, type DialogAction } from "@fndn/react";

/* Rename submits the form in the body: the browser checks the required field, Enter in it
 * renames, and the dialog closes on the form's submit */
const actions: DialogAction[] = [
  { label: "Cancel", value: "cancel", variant: "ghost" },
  { label: "Rename", value: "rename", variant: "primary", form: "rename-project-form" },
];

export default function RenameProject() {
  const [project, setProject] = useState("billing-api");
  const [name, setName] = useState(project);

  return (
    <div className="flex w-80 items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink">Project name</div>
        <div className="truncate text-xs text-ink-2" title={`northwind.dev/${project}`}>{`northwind.dev/${project}`}</div>
      </div>
      <Dialog
        size="sm"
        triggerLabel="Rename"
        title="Rename project"
        actions={actions}
        onOpenChange={(open) => { if (open) setName(project); }}
        initialFocus="input"
      >
        <form id="rename-project-form" onSubmit={(event) => { event.preventDefault(); setProject(name.trim() || project); }}>
          <Field label="Project name" required helper={`URLs become northwind.dev/${name.trim() || "…"}.`}>
            <Input name="name" value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
        </form>
      </Dialog>
    </div>
  );
}
