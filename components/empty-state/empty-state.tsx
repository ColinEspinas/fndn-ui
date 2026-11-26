import { Bell, Chats, CheckCircle, File, FolderOpen, Funnel, GitBranch, ListChecks, MagnifyingGlass, RocketLaunch, Table, Users } from "@phosphor-icons/react";
import { isValidElement, useEffect, useState, type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import { afterPaint } from "../lib/paint";
import { emptyState } from "./empty-state.recipe";

/** The empty-state glyphs, by their names in the icon list (`docs icons`). */
export type EmptyStateIcon =
  | "magnifying-glass" | "funnel" | "chats" | "folder-open" | "table" | "file"
  | "bell" | "check-circle" | "users" | "rocket-launch" | "list-checks" | "git-branch";
const ICONS = {
  "magnifying-glass": MagnifyingGlass, funnel: Funnel, chats: Chats, "folder-open": FolderOpen, table: Table, file: File,
  bell: Bell, "check-circle": CheckCircle, users: Users, "rocket-launch": RocketLaunch, "list-checks": ListChecks, "git-branch": GitBranch,
} satisfies Record<EmptyStateIcon, unknown>;

export type EmptyStateProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  /** The message. */
  title: ReactNode;
  /** Optional next step. */
  hint?: ReactNode;
  /** One of the empty-state glyphs by its vocabulary name, or your own icon element. A name is never drawn as text. */
  icon?: EmptyStateIcon | ReactElement;
  /** row: one line in a list. block: a centred stack for a popup or a table body. */
  size?: "row" | "block";
  /** Rows only: start or centre the line. */
  align?: "start" | "center";
  /** What to do next: a Button (or two), under a block's text or at the end of a row. */
  action?: ReactNode;
  /* anything else (hidden, id, role, aria-*) lands on the root, so a host can toggle it with hidden */
};

/** What a list, a table or a popup shows when there is nothing in it. */
export function EmptyState({ title, hint, icon, size = "row", align = "start", action, className, ...rest }: EmptyStateProps) {
  /* a name outside the list draws nothing (never the word itself) */
  const Glyph = typeof icon === "string" ? (ICONS as Record<string, typeof Bell | undefined>)[icon] : undefined;
  const own = isValidElement(icon) ? icon : null;
  /* no fade with the first paint: data-enter only after it (lib/paint.ts) */
  const [enter, setEnter] = useState(false);
  useEffect(() => (enter ? undefined : afterPaint(() => setEnter(true))), [enter]);
  const hasHint = hint != null && hint !== "";
  const r = emptyState({ size, align, hint: hasHint });
  return (
    <div data-slot="empty-state" className={r.base({ class: className })} data-enter={enter ? "" : undefined} {...rest}>
      {(Glyph || own) && (
        <span data-slot="empty-state-icon" className={r.icon()} aria-hidden>{Glyph ? <Glyph data-slot="icon" weight="bold" /> : own}</span>
      )}
      <p data-slot="empty-state-title" className={r.title()}>{title}</p>
      {hasHint && <p data-slot="empty-state-hint" className={r.hint()}>{hint}</p>}
      {action != null && action !== false && <div data-slot="empty-state-action" className={r.action()}>{action}</div>}
    </div>
  );
}
