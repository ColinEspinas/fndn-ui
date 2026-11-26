/* "New issue": a form in a dialog. The title is required; Enter in it creates the issue. The
 * buttons are the dialog's footer (Cancel, then the primary "Create issue"), tied to the form by
 * its id, so the form body keeps the dialog's padding and the footer its own band. */
import { useState } from "react";
import { Button, Combobox, Dialog, Field, Input, Select, Textarea } from "@fndn/react";
import { ME, PEOPLE, PRIORITIES, PROJECTS, STATUSES, type Issue, type Priority, type Status } from "./data";

export type Draft = Pick<Issue, "project" | "title" | "description" | "status" | "priority" | "assignee">;

type Props = { open: boolean; onOpenChange: (open: boolean) => void; project: string; onCreate: (draft: Draft) => void };

const FORM = "new-issue-form";
const blank = (project: string): Draft => ({ project, title: "", description: "", status: "todo", priority: "none", assignee: ME.value });

export function NewIssue({ open, onOpenChange, project, onCreate }: Props) {
  const [draft, setDraft] = useState<Draft>(() => blank(project));
  /* every new issue starts from a blank form: reset while rendering the opening, so its first
   * frame is already blank */
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) { setWasOpen(open); if (open) setDraft(blank(project)); }
  return (
    <Dialog
      open={open} onOpenChange={onOpenChange} title="New issue" size="md" initialFocus="input[name=title]"
      footer={(
        <>
          <Button type="button" variant="secondary" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form={FORM} variant="primary" size="sm" disabled={!draft.title.trim()}>Create issue</Button>
        </>
      )}
    >
      {open && <Form draft={draft} onDraftChange={setDraft} onCreate={onCreate} />}
    </Dialog>
  );
}

function Form({ draft, onDraftChange, onCreate }: { draft: Draft; onDraftChange: (d: Draft) => void; onCreate: (draft: Draft) => void }) {
  const set = (patch: Partial<Draft>) => onDraftChange({ ...draft, ...patch });
  return (
    <form id={FORM} className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (draft.title.trim()) onCreate({ ...draft, title: draft.title.trim() }); }}>
      <Field label="Title" required>
        <Input name="title" placeholder="Webhook deliveries time out after 10 s" value={draft.title} onChange={(e) => set({ title: e.target.value })} />
      </Field>
      <Field label="Description">
        <Textarea autoResize placeholder="What happens, and what should happen instead" value={draft.description} onChange={(e) => set({ description: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <Select label="Project" items={PROJECTS} value={draft.project} onValueChange={(v) => v && set({ project: v })} />
        <Combobox label="Assignee" items={[{ value: "unassigned", label: "Unassigned" }, ...PEOPLE]} value={draft.assignee ?? "unassigned"} onValueChange={(v) => v && set({ assignee: v === "unassigned" ? null : v })} />
        <Select label="Status" items={STATUSES.map((s) => ({ value: s.value, label: s.label }))} value={draft.status} onValueChange={(v) => v && set({ status: v as Status })} />
        <Select label="Priority" items={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))} value={draft.priority} onValueChange={(v) => v && set({ priority: v as Priority })} />
      </div>
    </form>
  );
}
