/* One issue: its title and description (plain text, edited in place: the field shows only while
 * editing), the properties as ghost controls (Linear's: a value that reads as text and opens on a
 * click, its name in ink-2 beside it), then the activity with the comments and a composer at the
 * end. Every change goes up to the app, which records it in the activity. */
import { useState } from "react";
import { ArrowLeft, Link, X } from "@phosphor-icons/react";
import {
  Avatar, Button, Card, CardBody, Combobox, DatePicker, Editable, Kbd, ScrollArea, Select, TagsInput, Textarea, Tooltip, toast,
} from "@fndn/react";
import { AssigneeMark } from "./Issues";
import { LABEL_TONES, ME, PEOPLE, PRIORITIES, STATUSES, personOf, priorityOf, statusOf, type Activity, type Issue, type Priority, type Status } from "./data";

export type IssueChange = Partial<Pick<Issue, "title" | "status" | "priority" | "assignee" | "due" | "labels" | "description">>;

const ASSIGNEES = [{ value: "unassigned", label: "Unassigned" }, ...PEOPLE.map((p) => ({ value: p.value, label: p.label, meta: p.value === ME.value ? "You" : undefined }))];
const mod = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl";

/** What a change says in the activity: "moved this to In review". */
export function describe(change: IssueChange): string | null {
  if (change.status) return `moved this to ${statusOf(change.status).label}`;
  if (change.priority) return `set priority to ${priorityOf(change.priority).label}`;
  if ("assignee" in change) return change.assignee ? `assigned ${personOf(change.assignee)?.label}` : "removed the assignee";
  if ("due" in change) return change.due ? "changed the due date" : "removed the due date";
  if (change.title) return "renamed the issue";
  return null;
}

type Props = {
  issue: Issue;
  onChange: (change: IssueChange) => void;
  onComment: (body: string) => void;
  onClose: () => void;
  /** The panel replaces the list (phone, narrow window): its close button reads "Back". */
  replaces: boolean;
};

export function IssueDetail({ issue, onChange, onComment, onClose, replaces }: Props) {
  const [comment, setComment] = useState("");
  const send = () => { if (!comment.trim()) return; onComment(comment.trim()); setComment(""); };

  /* one row of the inspector: a name, then the control that changes it */
  const prop = (name: string, control: React.ReactNode) => (
    <>
      <dt className="flex h-7 items-center text-sm text-ink-2">{name}</dt>
      <dd className="min-w-0">{control}</dd>
    </>
  );

  return (
    <section className="flex h-full min-w-0 flex-col bg-surface" aria-label={`${issue.id} ${issue.title}`} data-app="detail">
      <header className="flex h-11 shrink-0 items-center gap-1 border-b border-line ps-2 pe-2">
        {replaces ? (
          <Button variant="ghost" size="sm" icon={<ArrowLeft data-slot="icon" weight="bold" />} onClick={onClose}>Issues</Button>
        ) : (
          <Tooltip content="Close">
            <Button variant="ghost" size="sm" square muted aria-label="Close issue" icon={<X data-slot="icon" weight="bold" />} onClick={onClose} />
          </Tooltip>
        )}
        <span className="ms-1 font-mono text-xs text-ink-2">{issue.id}</span>
        <Tooltip content="Copy link">
          <Button
            variant="ghost" size="sm" square muted className="ms-auto" aria-label="Copy link to issue" icon={<Link data-slot="icon" weight="bold" />}
            onClick={() => toast({ title: "Link copied", description: `northwind.example/issues/${issue.id}`, duration: 3000 })}
          />
        </Tooltip>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        {/* in place of the list the issue keeps a reading width, as Linear's full issue view */}
        <div className={`flex flex-col gap-5 px-5 py-4 max-sm:px-4 ${replaces ? "mx-auto w-full max-w-[760px]" : ""}`}>
          {/* the key resets the field when another issue opens */}
          <Editable
            key={issue.id} variant="inline" aria-label="Title" activationMode="click" defaultValue={issue.title}
            className="text-lg font-semibold"
            onValueCommit={(title) => title.trim() && title !== issue.title && onChange({ title: title.trim() })}
          />

          {/* the key resets the text when another issue opens */}
          <Editable
            key={`d:${issue.id}`} multiline size="sm" aria-label="Description" placeholder="Add a description…" defaultValue={issue.description}
            className="-mx-2"
            onValueCommit={(description) => description !== issue.description && onChange({ description })}
          />

          <dl className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-x-2 gap-y-0.5">
            {prop("Status", <Select size="sm" variant="ghost" className="w-full" aria-label="Status" items={STATUSES.map((s) => ({ value: s.value, label: s.label }))} value={issue.status} onValueChange={(v) => v && onChange({ status: v as Status })} />)}
            {prop("Priority", <Select size="sm" variant="ghost" className="w-full" aria-label="Priority" items={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))} value={issue.priority} onValueChange={(v) => v && onChange({ priority: v as Priority })} />)}
            {prop("Assignee", (
              <Combobox
                size="sm" variant="ghost" className="w-full" aria-label="Assignee" placeholder="Unassigned" emptyText="No one in Northwind matches"
                caret={false} start={<AssigneeMark id={issue.assignee} size="20" />}
                items={ASSIGNEES} value={issue.assignee ?? "unassigned"} onValueChange={(v) => v && onChange({ assignee: v === "unassigned" ? null : v })}
              />
            ))}
            {prop("Due date", (
              <DatePicker
                size="sm" variant="ghost" className="w-full" aria-label="Due date" placeholder="No due date"
                value={issue.due ? [issue.due] : []} onValueChange={(v) => onChange({ due: v[0] ?? null })}
              />
            ))}
            {prop("Labels", <TagsInput size="sm" variant="ghost" tagVariant="outline" className="w-full" aria-label="Labels" placeholder="Add a label" tones={LABEL_TONES} value={issue.labels} onValueChange={(labels) => onChange({ labels })} />)}
          </dl>

          <section aria-labelledby="activity-title" className="flex flex-col gap-3">
            <h3 id="activity-title" className="text-sm font-semibold text-ink">Activity</h3>
            <ol className="flex flex-col gap-3">
              {issue.activity.map((a) => <Entry key={a.id} entry={a} />)}
            </ol>
            <div className="flex flex-col gap-2">
              <Textarea
                aria-label={`Comment on ${issue.id}`} placeholder="Leave a comment…" value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }}
              />
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-ink-2 max-sm:hidden"><Kbd keys={[mod, "Enter"]} /> to send</span>
                <Button size="sm" variant="primary" disabled={!comment.trim()} onClick={send}>Comment</Button>
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>
    </section>
  );
}

/** An event is one line; a comment is a card with its author. */
function Entry({ entry }: { entry: Activity }) {
  const who = personOf(entry.who)!;
  if (entry.kind === "event") {
    return (
      <li className="flex items-start gap-2 text-sm text-ink-2">
        <Avatar name={who.label} color={who.color} size="16" className="mt-0.5 shrink-0" />
        <span className="[unicode-bidi:plaintext]"><span className="font-medium text-ink">{who.label}</span> {entry.text} <span className="text-ink-2">· {entry.when}</span></span>
      </li>
    );
  }
  return (
    <li>
      <Card elevation="hairline">
        <CardBody className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-sm">
            <Avatar name={who.label} color={who.color} size="16" />
            <span className="font-medium text-ink">{who.label}</span>
            <span className="text-ink-2">{entry.when}</span>
          </span>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink-2 [unicode-bidi:plaintext]">{entry.body}</p>
        </CardBody>
      </Card>
    </li>
  );
}
