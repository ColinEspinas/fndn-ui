/* The source-control side view (VS Code's): a commit message, Commit, and the changed files as
 * dense rows of a flush list (part of the pane, no box): the name, its folder dimmed, a status letter at the end in its tone (M modified,
 * A added). Choosing a file opens its diff as a tab in the editor. */
import { useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { Button, Count, EmptyState, Listbox, ScrollArea, Textarea } from "@fndn/react";
import type { Change } from "./data";

const LETTER = { modified: { meta: "M", metaTone: "orange" }, added: { meta: "A", metaTone: "green" } } as const;

export function SourceControl({ changes, selected, branch, onSelect, onCommit }: {
  changes: Change[];
  selected: string | null;
  branch: string;
  onSelect: (path: string) => void;
  onCommit: (message: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const commit = () => {
    if (!message.trim()) return setInvalid(true);
    onCommit(message.trim());
    setLast(message.trim());
    setMessage("");
  };

  return (
    <div className="flex h-full min-w-0 flex-col bg-canvas" data-editor="source-control">
      <div className="flex h-8 shrink-0 items-center px-3 text-xs font-medium text-ink-2">Source control</div>
      {changes.length ? (
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-2 px-2 pb-1">
            <Textarea
              size="sm" rows={2} aria-label="Commit message" placeholder={`Message (Ctrl+Enter to commit on ${branch})`}
              value={message} invalid={invalid}
              onChange={(e) => { setMessage(e.target.value); setInvalid(false); }}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); commit(); } }}
            />
            <Button size="sm" variant="accent" onClick={commit}>Commit</Button>
            <h3 className="mt-1 flex items-center gap-1.5 text-xs font-medium text-ink-2" aria-hidden>Changes <Count size="sm">{String(changes.length)}</Count></h3>
          </div>
          {/* flush: the rows are part of the pane, edge to edge, their text on the pane's 8px inset */}
          <Listbox
            variant="flush" size="xs" className="w-full pb-2" aria-label={`Changes, ${changes.length}`}
            items={changes.map((c) => {
              const folder = c.path.split("/").slice(0, -1).join("/");
              return { value: c.path, label: c.path.split("/").pop()!, ...(folder ? { description: folder } : {}), ...LETTER[c.status] };
            })}
            value={selected ? [selected] : []}
            onValueChange={(v) => v[0] && onSelect(v[0])}
          />
        </ScrollArea>
      ) : (
        <EmptyState className="p-6" size="block" icon={<CheckCircle weight="fill" />} title="No changes" hint={last ? `Committed “${last}” to ${branch}.` : "The working tree is clean."} />
      )}
    </div>
  );
}
