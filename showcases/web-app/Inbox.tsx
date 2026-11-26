/* The inbox: what happened to Maya's issues, newest first, unread ones marked with a dot. Wide,
 * it is Linear's list + preview: a notification opens its issue beside the list (and is read),
 * and the inbox opens on the newest one, so the preview is never a half-screen empty state;
 * narrow, a notification opens the issue in its project. "Mark all as read" clears the dots. */
import type { ReactNode } from "react";
import { Button, EmptyState, PageHeader, ScrollArea } from "@fndn/react";
import { personOf, type Issue, type Notification } from "./data";
import { AssigneeMark } from "./Issues";

type Props = {
  items: Notification[];
  issues: Issue[];
  /** The notification shown in the preview (wide only). */
  current: string | null;
  onSelect: (id: string) => void;
  onMarkAllRead: () => void;
  /** Wide: the list and the preview side by side. Narrow: the list alone (a notification opens its issue in its project). */
  split: boolean;
  /** The issue beside the list (split only). */
  preview?: ReactNode;
};

export function Inbox({ items, issues, current, onSelect, onMarkAllRead, split, preview }: Props) {
  const unread = items.filter((n) => !n.read).length;
  const list = (
    <div className="flex h-full min-h-0 flex-col" data-app="inbox">
      {/* the ghost button's own padding brings its label to the pane's 16px: 8px at the end */}
      <PageHeader
        size="pane" className="shrink-0 pe-2" title="Inbox"
        description={unread > 0 ? `${unread} unread` : undefined}
        actions={unread > 0 && <Button variant="ghost" size="sm" muted onClick={onMarkAllRead}>Mark all as read</Button>}
      />
      {items.length ? (
        <ScrollArea className="min-h-0 flex-1" aria-label="Notifications">
        <ul className="flex flex-col">
          {items.map((n) => {
            const who = personOf(n.who)!;
            const issue = issues.find((i) => i.id === n.issue);
            const on = split && n.id === current;
            return (
              <li key={n.id} className="border-b border-line-soft" data-notification={n.id} data-unread={n.read ? undefined : ""}>
                <button
                  type="button" disabled={!issue} aria-current={on || undefined} onClick={() => onSelect(n.id)}
                  className={`flex w-full items-start gap-2.5 py-2.5 ps-2 pe-4 text-start motion-colors-fast hover:bg-hover disabled:opacity-60 ${on ? "bg-hover" : ""}`}
                >
                  {/* the unread dot keeps its column when read, so the rows share one text edge */}
                  <span className="flex h-5 w-2 shrink-0 items-center justify-center" aria-hidden>
                    {!n.read && <span className="size-1.5 rounded-full bg-accent" />}
                  </span>
                  <AssigneeMark id={n.who} size="20" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-baseline gap-2">
                      <span className="shrink-0 font-mono text-xs text-ink-2">{n.issue}</span>
                      <span className={`truncate text-sm [unicode-bidi:plaintext] ${n.read ? "text-ink-2" : "font-medium text-ink"}`} title={issue?.title}>{issue?.title ?? "(deleted)"}</span>
                    </span>
                    <span className="truncate text-sm text-ink-2 [unicode-bidi:plaintext]" title={`${who.label} ${n.text}`}>
                      <span className="text-ink-2">{who.label}</span> {n.text}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs leading-5 text-ink-2">{n.when}</span>
                  {!n.read && <span className="sr-only">Unread</span>}
                </button>
              </li>
            );
          })}
        </ul>
        </ScrollArea>
      ) : (
        <EmptyState className="flex-1" size="block" icon="chats" title="Nothing in your inbox" hint="Mentions, assignments and comments on your issues show up here." />
      )}
    </div>
  );
  if (!split) return list;
  return (
    <div className="grid h-full grid-cols-[minmax(18rem,26rem)_minmax(0,1fr)]">
      <div className="min-h-0 min-w-0 border-e border-line">{list}</div>
      <div className="min-h-0 min-w-0">
        {preview ?? <EmptyState className="h-full" size="block" icon="bell" title="No notification selected" hint="Pick one to read its issue here." />}
      </div>
    </div>
  );
}
