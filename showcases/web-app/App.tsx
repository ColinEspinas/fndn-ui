/* An issue tracker for the Northwind team: a sidebar with the inbox, the issue views and the
 * projects; a top bar with the breadcrumb, search (Ctrl/⌘ K) and the account menu; the issue list
 * with filters and bulk actions; an issue panel beside the list (or instead of it when the window is
 * narrow); project settings with a danger zone; toasts for what happened. All state lives here,
 * the views are in Issues.tsx, IssueDetail.tsx, Inbox.tsx, Settings.tsx and NewIssue.tsx.
 *
 * Keyboard: Ctrl/⌘ K searches issues and commands, C creates an issue. Both are bound on the
 * app's root, so they work while the app has focus and leave the page's own keys alone.
 * Below 720px the app shows one view at a time, picked at the bottom.
 *
 * A rounded app: the page that hosts it has <html data-shape="rounded"> (index.json tells the
 * docs site), so no button, toggle or switcher here names a shape, and its dialogs follow. */
import { useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Bell, CheckCircle, Circle, Cube, Gear, ListChecks, MagnifyingGlass, Plus, SignOut, User, UserPlus } from "@phosphor-icons/react";
import { Avatar, Breadcrumb, Button, CommandPalette, Kbd, LoadingState, Menu, Select, SegmentedControl, SidebarNav, Splitter, Toast, toast, type CommandPaletteItem, type MenuEntry } from "@fndn/react";
import { ISSUES, ME, NOTIFICATIONS, PROJECTS, TODAY, personOf, statusOf, type Issue } from "./data";
import { Inbox } from "./Inbox";
import { IssueDetail, describe, type IssueChange } from "./IssueDetail";
import { Issues, NO_FILTER, type Bulk } from "./Issues";
import { NewIssue, type Draft } from "./NewIssue";
import { Settings } from "./Settings";
import { useWidth } from "./useWidth";

/** inbox · my issues · all issues · one project's issues · that project's settings */
type View = "inbox" | "mine" | "all" | "project" | "settings";
const mod = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl";
const issues = (n: number) => (n === 1 ? "1 issue" : `${n} issues`);

const ACCOUNT_MENU: MenuEntry[] = [
  { type: "group", label: `${ME.label} · ${ME.email}`, items: [
    { value: "mine", label: "My issues", icon: <User data-slot="icon" weight="bold" /> },
    { value: "settings", label: "Project settings", icon: <Gear data-slot="icon" weight="bold" /> },
    { value: "invite", label: "Invite teammates", icon: <UserPlus data-slot="icon" weight="bold" /> },
  ] },
  { type: "separator" },
  { value: "sign-out", label: "Sign out", icon: <SignOut data-slot="icon" weight="bold" /> },
];

export default function App() {
  const [root, width] = useWidth();
  const phone = width > 0 && width < 720;
  /* the issue panel sits beside the list only when both have room (the list keeps its titles
   * readable); narrower, the issue takes the list's place at a reading width, as Linear's */
  const split = width >= 1100;

  const [all, setAll] = useState<Issue[]>(ISSUES);
  const [projects, setProjects] = useState(PROJECTS);
  const [inbox, setInbox] = useState(NOTIFICATIONS);
  const [note, setNote] = useState<string | null>(null);
  const [view, setView] = useState<View>("project");
  const [project, setProject] = useState("web-app");
  const [openId, setOpenId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState(NO_FILTER);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [palette, setPalette] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sizes, setSizes] = useState([58, 42]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const current = projects.find((p) => p.value === project) ?? projects[0];
  const open = all.find((i) => i.id === openId) ?? null;
  const scoped = useMemo(
    () => (view === "mine" ? all.filter((i) => i.assignee === ME.value) : view === "all" ? all : all.filter((i) => i.project === project)),
    [all, view, project],
  );

  /* ── navigation ─────────────────────────────────────────── */
  const go = (to: View, p = project) => {
    if (to !== view || p !== project) setFilter(NO_FILTER);
    /* wide, the inbox opens on the newest notification (Linear's), which is then read */
    if (to === "inbox" && view !== "inbox" && split && !note && inbox[0]) pickNote(inbox[0].id);
    setView(to);
    setSelected([]);
    if (to !== "project" || p !== project) setOpenId(null);
    /* another project's issues "load" for a moment; the views already on screen show at once */
    if (to === "project" && p !== project) {
      clearTimeout(timer.current);
      setLoading(true);
      timer.current = setTimeout(() => setLoading(false), 500);
    }
    setProject(p);
  };
  const openIssue = (id: string) => {
    const issue = all.find((i) => i.id === id);
    if (!issue) return;
    /* from the inbox or settings, or for another project's issue: that project's list */
    if (view === "inbox" || view === "settings" || (view === "project" && issue.project !== project)) go("project", issue.project);
    setOpenId(id);
  };

  /* ── changes ────────────────────────────────────────────── */
  const now = () => "just now";
  const event = (text: string) => ({ id: `e${Date.now()}${Math.random()}`, who: ME.value, when: now(), kind: "event" as const, text });
  const change = (id: string, patch: IssueChange) => {
    const text = describe(patch);
    setAll((list) => list.map((i) => (i.id === id ? { ...i, ...patch, activity: text ? [...i.activity, event(text)] : i.activity } : i)));
  };
  const comment = (id: string, body: string) =>
    setAll((list) => list.map((i) => (i.id === id ? { ...i, activity: [...i.activity, { id: `m${Date.now()}`, who: ME.value, when: now(), kind: "comment", body }] } : i)));

  const bulk = (ids: string[], what: Bulk) => {
    const before = all;
    if ("remove" in what) {
      setAll((list) => list.filter((i) => !ids.includes(i.id)));
      if (openId && ids.includes(openId)) setOpenId(null);
      toast({ title: `${issues(ids.length)} deleted`, action: { label: "Undo", onClick: () => setAll(before) } });
      return;
    }
    ids.forEach((id) => change(id, what));
    const to = "status" in what ? `moved to ${statusOf(what.status).label}` : what.assignee ? `assigned to ${what.assignee === ME.value ? "you" : personOf(what.assignee)?.label}` : "unassigned";
    toast({ title: `${issues(ids.length)} ${to}`, tone: "green", duration: 3000, action: { label: "Undo", onClick: () => setAll(before) } });
  };

  const create = (draft: Draft) => {
    const key = projects.find((p) => p.value === draft.project)?.key ?? "WEB";
    const next = Math.max(0, ...all.filter((i) => i.id.startsWith(`${key}-`)).map((i) => Number(i.id.split("-")[1]))) + 1;
    const id = `${key}-${next}`;
    setAll((list) => [{ ...draft, id, due: null, labels: [], activity: [{ id: `c${id}`, who: ME.value, when: now(), kind: "event", text: "created the issue" }] }, ...list]);
    setCreating(false);
    if (view === "project" && draft.project !== project) go("project", draft.project);
    setOpenId(id);
    toast({ title: `${id} created`, description: draft.title, tone: "green", duration: 4000 });
  };

  const removeProject = (archived: boolean) => {
    const gone = current!;
    const rest = projects.filter((p) => p.value !== gone.value);
    setProjects(rest);
    if (!archived) setAll((list) => list.filter((i) => i.project !== gone.value));
    go("all", rest[0]?.value ?? "");
    toast(archived
      ? { title: `${gone.label} archived`, description: "Restore it from workspace settings.", action: { label: "Undo", onClick: () => setProjects(projects) } }
      : { title: `${gone.label} deleted`, tone: "red" });
  };

  /* ── commands: the palette and the shortcuts ─────────────── */
  /* the system's command palette (Linear's ⌘K): the first row starts highlighted, so Enter runs it;
   * rows are listed under their group, each with its icon; an issue shows its key as meta */
  const commands = useMemo((): CommandPaletteItem[] => [
    { value: "new", label: "Create issue", group: "Actions", shortcut: ["C"], icon: <Plus data-slot="icon" weight="bold" /> },
    { value: "go:inbox", label: "Go to inbox", group: "Navigation", icon: <Bell data-slot="icon" weight="bold" /> },
    { value: "go:mine", label: "Go to my issues", group: "Navigation", icon: <User data-slot="icon" weight="bold" /> },
    { value: "go:settings", label: "Open project settings", group: "Navigation", icon: <Gear data-slot="icon" weight="bold" /> },
    ...projects.map((p) => ({ value: `project:${p.value}`, label: `Open ${p.label}`, group: "Projects", icon: <Cube data-slot="icon" weight="bold" /> })),
    ...all.map((i) => ({
      value: `issue:${i.id}`, label: i.title, meta: i.id, group: "Issues", keywords: [i.id],
      icon: i.status === "done" ? <CheckCircle data-slot="icon" weight="bold" /> : <Circle data-slot="icon" weight="bold" />,
    })),
  ], [all, projects]);
  const run = (value: string) => {
    if (value === "new") setCreating(true);
    else if (value.startsWith("go:")) go(value.slice(3) as View);
    else if (value.startsWith("project:")) go("project", value.slice(8));
    else if (value.startsWith("issue:")) openIssue(value.slice(6));
  };
  const account = (value: string) => {
    if (value === "mine" || value === "settings") go(value);
    else if (value === "invite") toast({ title: "Invite link copied", description: "Anyone with it can join Northwind as a member for 7 days.", duration: 4000 });
    else if (value === "sign-out") toast({ title: "Signing out is turned off in this demo" });
  };
  const typing = (el: Element) => el.closest("input, textarea, [contenteditable=true], [role=combobox], [role=dialog], [role=alertdialog]");
  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "k") { e.preventDefault(); e.stopPropagation(); setPalette(true); return; }
    if (e.key === "c" && !e.ctrlKey && !e.metaKey && !e.altKey && !typing(e.target as Element)) { e.preventDefault(); setCreating(true); }
  };
  /* the sidebar's links are the app's routes: onNavigate keeps the page where it is and the app
   * follows the link in its own state */
  const navigate = (value: string, _href: string, e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (projects.some((p) => p.value === value)) go("project", value); else go(value as View);
  };
  const unread = inbox.filter((n) => !n.read).length;

  /* ── the views ──────────────────────────────────────────── */
  const sidebarCurrent = view === "project" ? project : view;
  const sidebar = (
    <div className="flex h-full shrink-0 border-e border-line bg-surface pt-1">
      <SidebarNav
        size="sm" label="Northwind" logo={<ListChecks data-slot="icon" weight="bold" />}
        workspaces={[{ value: "northwind", label: "Northwind" }]} workspace="northwind"
        actions={[{ value: "invite", label: "Invite teammates", icon: "user-plus" }, { value: "settings", label: "Project settings", icon: "gear" }]}
        onWorkspaceAction={account}
        items={[
          { value: "inbox", label: "Inbox", href: "#inbox", icon: "bell", badge: unread ? String(unread) : undefined },
          { value: "mine", label: "My issues", href: "#mine", icon: <User data-slot="icon" weight="bold" /> },
          { value: "all", label: "All issues", href: "#all", icon: <ListChecks data-slot="icon" weight="bold" /> },
          { value: "settings", label: "Project settings", href: "#settings", icon: "gear" },
        ]}
        sections={[{ value: "projects", label: "Projects", items: projects.map((p) => ({ value: p.value, label: p.label, href: `#${p.value}`, icon: "cube" })) }]}
        current={sidebarCurrent}
        onNavigate={navigate}
        collapsed={collapsed} onCollapsedChange={setCollapsed}
      />
    </div>
  );

  const scopeName = view === "mine" ? "My issues" : view === "all" ? "All issues" : current?.label ?? "Northwind";
  const projectPicker = phone && view === "project" && (
    <Select size="sm" variant="ghost" className="font-semibold" aria-label="Project" items={projects} value={project} onValueChange={(v) => v && go("project", v)} />
  );
  const list = loading ? (
    <div className="grid h-full place-items-center"><LoadingState variant="dots" label={`Loading ${scopeName} issues`} /></div>
  ) : (
    <Issues
      key={`${view}:${project}`} issues={scoped} scope={scopeName} filter={filter} onFilterChange={setFilter} openId={openId} onOpen={setOpenId}
      selected={selected} onSelectedChange={setSelected} onBulk={bulk} onNew={() => setCreating(true)} phone={phone} start={projectPicker}
    />
  );
  const detail = open && (
    <IssueDetail
      issue={open} replaces={!split} onClose={() => setOpenId(null)}
      onChange={(patch) => change(open.id, patch)} onComment={(body) => comment(open.id, body)}
    />
  );
  /* side by side, the splitter stays mounted (the list keeps its scroll); a closed panel has no size */
  const issueViews = !split ? (open ? detail : list) : (
    <Splitter
      className="h-full" handleLabel="Resize the issue panel" size={open ? sizes : [100, 0]}
      onSizeChange={(s) => { if (!open) return; if (s[1] === 0) setOpenId(null); else setSizes(s); }}
      panels={[{ id: "list", minSize: 40, content: list }, { id: "issue", minSize: 30, maxSize: 55, collapsible: true, content: detail || null }]}
    />
  );
  /* the inbox: wide, the notification's issue beside the list; narrow, the issue in its project */
  const noteIssue = all.find((i) => i.id === inbox.find((n) => n.id === note)?.issue) ?? null;
  const pickNote = (id: string) => {
    const n = inbox.find((x) => x.id === id);
    if (!n) return;
    setInbox((list) => list.map((x) => (x.id === id ? { ...x, read: true } : x)));
    if (split) setNote(id); else openIssue(n.issue);
  };
  const main =
    view === "inbox" ? (
      <Inbox
        items={inbox} issues={all} current={note} onSelect={pickNote} split={split}
        onMarkAllRead={() => setInbox((list) => list.map((n) => ({ ...n, read: true })))}
        preview={noteIssue && (
          <IssueDetail
            issue={noteIssue} replaces={false} onClose={() => setNote(null)}
            onChange={(patch) => change(noteIssue.id, patch)} onComment={(body) => comment(noteIssue.id, body)}
          />
        )}
      />
    )
    : view === "settings" && current ? (
      <Settings
        key={current.value} project={current} issueCount={all.filter((i) => i.project === current.value).length}
        onRename={(label, key) => setProjects((ps) => ps.map((p) => (p.value === current.value ? { ...p, label, key } : p)))}
        onArchive={() => removeProject(true)} onDelete={() => removeProject(false)}
      />
    ) : issueViews;

  const crumbs = [
    { label: "Northwind", href: "#all" },
    ...(view === "project" || view === "settings" ? [{ label: current?.label ?? "", href: "#project" }] : []),
    { label: view === "inbox" ? "Inbox" : view === "settings" ? "Settings" : view === "mine" ? "My issues" : view === "all" ? "All issues" : "Issues", href: open ? "#list" : undefined },
    ...(open && view !== "inbox" && view !== "settings" ? [{ label: open.id }] : []),
  ];
  const crumb = (href: string | undefined) => {
    if (href === "#all") go("all");
    else if (href === "#project") go("project");
    else if (href === "#list") setOpenId(null);
  };

  const header = (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-4 max-sm:gap-1.5 max-sm:ps-3 max-sm:pe-2">
      <Breadcrumb className="min-w-0 flex-1" label="You are here" items={crumbs} maxItems={phone ? 2 : undefined} onNavigate={crumb} />
      {phone ? (
        <>
          <Button variant="ghost" size="md" square muted aria-label="Search issues and commands" icon={<MagnifyingGlass data-slot="icon" weight="bold" />} onClick={() => setPalette(true)} />
          <Button variant="ghost" size="md" square muted aria-label="New issue" icon={<Plus data-slot="icon" weight="bold" />} onClick={() => setCreating(true)} />
        </>
      ) : (
        <span className="relative flex w-64 max-w-[40%]">
          <Button variant="outline" size="sm" className="w-full justify-start pe-16 text-ink-3" icon={<MagnifyingGlass data-slot="icon" weight="bold" />} aria-keyshortcuts="Control+K Meta+K" onClick={() => setPalette(true)} data-app="search">
            Search issues
          </Button>
          <span className="pointer-events-none absolute inset-y-0 end-1.5 flex items-center" aria-hidden><Kbd keys={[mod, "K"]} /></span>
        </span>
      )}
      <Menu items={ACCOUNT_MENU} placement="bottom-end" onSelect={account}>
        <Button variant="ghost" size={phone ? "md" : "sm"} square aria-label={`Account: ${ME.label}`} icon={<Avatar name={ME.label} color={ME.color} size="20" />} data-app="account" />
      </Menu>
    </header>
  );

  const phoneNav = (
    <nav aria-label="Views" className="shrink-0 border-t border-line p-2">
      <SegmentedControl
        fill size="md" className="w-full" aria-label="View" value={view === "project" ? "issues" : view === "all" ? "issues" : view}
        onValueChange={(v) => go(v === "issues" ? "project" : (v as View))}
        options={[
          { value: "inbox", label: "Inbox", count: unread || undefined },
          { value: "issues", label: "Issues" },
          { value: "mine", label: "Mine" },
          { value: "settings", label: "Settings" },
        ]}
      />
    </nav>
  );

  return (
    <div
      ref={root} tabIndex={-1} onKeyDown={onKeyDown} data-showcase="web-app" data-layout={phone ? "phone" : split ? "split" : "single"} data-today={TODAY}
      className="flex h-full bg-page text-ink outline-none"
    >
      {!phone && sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        <main className="min-h-0 flex-1">{main}</main>
        {phone && phoneNav}
      </div>

      <CommandPalette
        items={commands} limit={8} hotkey={false} open={palette} onOpenChange={setPalette} onSelect={run}
        title="Search" label="Search issues and commands" placeholder="Search issues, projects and commands…"
        emptyTitle="Nothing matches" emptyHint="Try an issue number such as WEB-482, or a word from its title."
      />
      <NewIssue open={creating} onOpenChange={setCreating} project={view === "project" ? project : "web-app"} onCreate={create} />
      <Toast />
    </div>
  );
}
