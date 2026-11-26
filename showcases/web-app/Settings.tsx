/* A project's settings: General (name, identifier, default assignee; a save that is enabled once
 * something changed) with a danger zone, and Notifications (switches that apply at once). */
import { useState, type ReactNode } from "react";
import {
  AlertDialog, Button, Card, CardBody, CardDescription, CardHeader, CardTitle, Field, Input, PageHeader, ScrollArea, Select, Switch, Tabs, toast,
} from "@fndn/react";
import { PEOPLE, type Project } from "./data";

const ASSIGNEES = [{ value: "none", label: "No one" }, ...PEOPLE.map((p) => ({ value: p.value, label: p.label }))];

/** A setting: its name and what it does, the control at the end; wraps under the text when narrow. */
const Row = ({ title, hint, children }: { title: string; hint: string; children: ReactNode }) => (
  <CardBody className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line-soft last:border-0">
    <div className="flex min-w-[200px] flex-1 flex-col gap-0.5"><span className="text-ink">{title}</span><span className="text-sm text-ink-2">{hint}</span></div>
    {children}
  </CardBody>
);

type Props = { project: Project; issueCount: number; onRename: (label: string, key: string) => void; onArchive: () => void; onDelete: () => void };

export function Settings({ project, issueCount, onRename, onArchive, onDelete }: Props) {
  const [tab, setTab] = useState("general");
  const [name, setName] = useState(project.label);
  const [key, setKey] = useState(project.key);
  const [assignee, setAssignee] = useState("none");
  const [saved, setSaved] = useState({ name: project.label, key: project.key, assignee: "none" });
  const [notify, setNotify] = useState({ assigned: true, mentions: true, status: false, digest: true });
  const [confirm, setConfirm] = useState(false);

  const keyError = /^[A-Z]{2,5}$/.test(key) ? undefined : "2 to 5 capital letters, such as WEB.";
  const dirty = name !== saved.name || key !== saved.key || assignee !== saved.assignee;
  const save = () => {
    setSaved({ name, key, assignee });
    onRename(name.trim(), key);
    toast({ title: "Project settings saved", tone: "green", duration: 3000 });
  };

  const general = (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader><CardTitle>Project</CardTitle><CardDescription>How {saved.name} appears across Northwind.</CardDescription></CardHeader>
        <CardBody>
          <form className="flex max-w-96 flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (dirty && !keyError && name.trim()) save(); }}>
            <Field label="Name" required invalid={!name.trim()} error={name.trim() ? undefined : "A project needs a name."}>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Identifier" helper={`Issue IDs start with it: ${key || "WEB"}-482.`} invalid={!!keyError} error={keyError}>
              <Input mono value={key} maxLength={5} onChange={(e) => setKey(e.target.value.toUpperCase())} />
            </Field>
            <Select label="Default assignee" items={ASSIGNEES} value={assignee} onValueChange={(v) => setAssignee(v ?? "none")} />
            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="sm" disabled={!dirty || !!keyError || !name.trim()}>Save changes</Button>
              {dirty && <Button type="button" variant="secondary" size="sm" onClick={() => { setName(saved.name); setKey(saved.key); setAssignee(saved.assignee); }}>Discard</Button>}
            </div>
          </form>
        </CardBody>
      </Card>
      {/* the danger zone says so by its title and its red-outlined buttons (GitHub's): the filled
          red is kept for the confirm dialog, where the deletion is decided */}
      <Card data-app="danger-zone">
        <CardHeader><CardTitle className="text-red">Danger zone</CardTitle></CardHeader>
        <Row title="Archive project" hint="Hide it from the sidebar. Its issues stay searchable and you can restore it.">
          <Button size="sm" variant="danger-outline" onClick={onArchive}>Archive</Button>
        </Row>
        <Row title="Delete project" hint={`Remove ${saved.name} and its ${issueCount === 1 ? "issue" : `${issueCount} issues`} for everyone. This cannot be undone.`}>
          <AlertDialog
            open={confirm} onOpenChange={setConfirm} tone="danger"
            trigger={<Button size="sm" variant="danger-outline">Delete project</Button>}
            title={`Delete ${saved.name}?`}
            description={`Its ${issueCount === 1 ? "issue" : `${issueCount} issues`}, comments and activity are deleted for everyone in Northwind. This cannot be undone.`}
            actionLabel="Delete project"
            onAction={onDelete}
          />
        </Row>
      </Card>
    </div>
  );

  const set = (k: keyof typeof notify) => (on: boolean) => setNotify((n) => ({ ...n, [k]: on }));
  const notifications = (
    <Card>
      <CardHeader><CardTitle>Notify me about</CardTitle><CardDescription>In your inbox, and by email to maya@northwind.example.</CardDescription></CardHeader>
      <Row title="Issues assigned to me" hint="When someone assigns you or reassigns your issue."><Switch label="Issues assigned to me" checked={notify.assigned} onCheckedChange={set("assigned")} /></Row>
      <Row title="Mentions" hint="When someone writes @maya in a comment."><Switch label="Mentions" checked={notify.mentions} onCheckedChange={set("mentions")} /></Row>
      <Row title="Status changes" hint="On issues you created."><Switch label="Status changes" checked={notify.status} onCheckedChange={set("status")} /></Row>
      <Row title="Weekly digest" hint="Every Monday at 9:00: what moved in this project."><Switch label="Weekly digest" checked={notify.digest} onCheckedChange={set("digest")} /></Row>
    </Card>
  );

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex max-w-[720px] flex-col gap-4 px-6 py-6 max-sm:px-3 max-sm:py-4" data-app="settings">
        <PageHeader title="Settings" />
        <Tabs
          aria-label="Settings" value={tab} onValueChange={setTab}
          items={[
            { value: "general", label: "General", content: general },
            { value: "notifications", label: "Notifications", content: notifications },
          ]}
        />
      </div>
    </ScrollArea>
  );
}
