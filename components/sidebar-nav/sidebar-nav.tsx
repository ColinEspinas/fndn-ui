"use client";
import { useLocaleContext } from "@ark-ui/react/locale";
import {
  Bell, BookmarkSimple, Calendar, CaretDown, ChartBar, ChatCircle, Chats, Circle, Cube, Database, Folder, FolderOpen, Gear, Hash, House, IceCream,
  Lightning, MagnifyingGlass, NotePencil, Plus, RocketLaunch, SidebarSimple, SignOut, SquaresFour, Star, Storefront, UserPlus, Users,
} from "@phosphor-icons/react";
import { isValidElement, useEffect, useRef, useState, type ComponentType, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { Button } from "../button/button";
import { Collapsible } from "../collapsible/collapsible";
import { Count } from "../count/count";
import { EmptyState } from "../empty-state/empty-state";
import { Menu, type MenuEntry } from "../menu/menu";
import { menu } from "../menu/menu.recipe";
import { sidebarNav } from "./sidebar-nav.recipe";
import { Tooltip } from "../tooltip/tooltip";
import { glide } from "../lib/glide";
import { trackModality } from "../lib/modality";

/** Names of the icons this component knows by name; pass any element for others. */
export type SidebarNavIconName =
  | "bell" | "bookmark-simple" | "calendar" | "chart-bar" | "chat-circle" | "chats" | "circle" | "cube" | "database" | "folder" | "folder-open"
  | "gear" | "hash" | "house" | "ice-cream" | "lightning" | "magnifying-glass" | "note-pencil" | "plus" | "rocket-launch" | "sign-out"
  | "squares-four" | "star" | "storefront" | "user-plus" | "users";
export type SidebarNavIcon = SidebarNavIconName | ReactNode;
export type SidebarNavItem = { value: string; label: string; href: string; icon: SidebarNavIcon; badge?: string };
/** A link in the chats or a section: an icon is optional (without one, its text lines up with the labels). */
export type SidebarNavChat = { value: string; label: string; href: string; icon?: SidebarNavIcon };
export type SidebarNavLink = SidebarNavChat;
/** A labelled, collapsible group of links under the primary ones (projects, teams). */
export type SidebarNavSection = { value: string; label: string; items: ReadonlyArray<SidebarNavLink> };
export type SidebarNavWorkspace = { value: string; label: string };
export type SidebarNavAction = { type?: "item"; value: string; label: string; icon?: SidebarNavIcon; tone?: "default" | "danger" } | { type: "separator" };

const GLYPHS: Record<SidebarNavIconName, ComponentType<{ className?: string; weight?: "bold" }>> = {
  bell: Bell, "bookmark-simple": BookmarkSimple, calendar: Calendar, "chart-bar": ChartBar, "chat-circle": ChatCircle, chats: Chats,
  circle: Circle, cube: Cube, database: Database, folder: Folder, "folder-open": FolderOpen, gear: Gear, hash: Hash, house: House,
  "ice-cream": IceCream, lightning: Lightning, "magnifying-glass": MagnifyingGlass, "note-pencil": NotePencil, plus: Plus,
  "rocket-launch": RocketLaunch, "sign-out": SignOut, "squares-four": SquaresFour, star: Star, storefront: Storefront, "user-plus": UserPlus, users: Users,
};
const glyph = (icon: SidebarNavIcon | undefined): ReactNode => {
  if (typeof icon === "string") { const Glyph = GLYPHS[icon as SidebarNavIconName]; return Glyph ? <Glyph data-slot="icon" weight="bold" /> : null; }
  return isValidElement(icon) ? icon : null;
};

const DEFAULT_ACTIONS: SidebarNavAction[] = [
  { value: "new-workspace", label: "New workspace", icon: "plus" },
  { value: "settings", label: "Workspace settings", icon: "gear" },
  { type: "separator" },
  { value: "sign-out", label: "Sign out", icon: "sign-out" },
];

export type SidebarNavProps = {
  workspaces: ReadonlyArray<SidebarNavWorkspace>;
  workspace?: string;
  defaultWorkspace?: string;
  onWorkspaceChange?: (value: string) => void;
  /** Menu actions under the workspaces. */
  actions?: ReadonlyArray<SidebarNavAction>;
  onWorkspaceAction?: (value: string) => void;
  /** Primary links, each with an icon. */
  items: ReadonlyArray<SidebarNavItem>;
  /** Labelled groups of links under the primary ones (projects, teams); each folds on its own. */
  sections?: ReadonlyArray<SidebarNavSection>;
  /** Recent chats. Without sections the Chats section is always shown (empty: emptyLabel); with sections, only when chats is given. */
  chats?: ReadonlyArray<SidebarNavChat>;
  /** Value of the current link (an item or a chat). */
  current?: string;
  defaultCurrent?: string;
  onCurrentChange?: (value: string) => void;
  /** A link was followed (before it becomes current). Call event.preventDefault() to route in the app instead of loading href. */
  onNavigate?: (value: string, href: string, event: MouseEvent<HTMLAnchorElement>) => void;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  chatsOpen?: boolean;
  defaultChatsOpen?: boolean;
  onChatsOpenChange?: (open: boolean) => void;
  logo?: SidebarNavIcon;
  /** Accessible name of the nav. */
  label?: string;
  chatsLabel?: string;
  emptyLabel?: string;
  /** Row size, dimensions only: md 32px rows, 14px text (default); sm 28px rows, 13px text, for a dense app with 13px content. */
  size?: "sm" | "md";
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/** One value that is controlled when `value` is given and remembers itself otherwise. */
function useControllable<T>(value: T | undefined, initial: T, onChange?: (next: T) => void): [T, (next: T) => void] {
  const [own, setOwn] = useState(initial);
  const current = value === undefined ? own : value;
  return [current, (next) => { if (value === undefined) setOwn(next); onChange?.(next); }];
}

/** The app's left rail: workspace switcher, links and recent chats; collapses to icons. */
export function SidebarNav({
  workspaces, workspace: workspaceProp, defaultWorkspace, onWorkspaceChange, actions = DEFAULT_ACTIONS, onWorkspaceAction,
  items, sections, chats: chatsProp, current: currentProp, defaultCurrent, onCurrentChange, onNavigate,
  collapsed: collapsedProp, defaultCollapsed = false, onCollapsedChange,
  chatsOpen: chatsOpenProp, defaultChatsOpen = true, onChatsOpenChange,
  logo = "squares-four", label = "Workspace navigation", chatsLabel = "Chats", emptyLabel = "No chats yet", size = "md", className, style, ...data
}: SidebarNavProps) {
  const [workspace, setWorkspace] = useControllable(workspaceProp, defaultWorkspace ?? workspaces[0]?.value ?? "", onWorkspaceChange);
  const [current, setCurrent] = useControllable<string | undefined>(currentProp, defaultCurrent, (v) => onCurrentChange?.(v!));
  const [collapsed, setCollapsed] = useControllable(collapsedProp, defaultCollapsed, onCollapsedChange);
  const [chatsOpen, setChatsOpen] = useControllable(chatsOpenProp, defaultChatsOpen, onChatsOpenChange);
  const [menuOpen, setMenuOpen] = useState(false);
  const chats = chatsProp ?? [];
  const showChats = chatsProp !== undefined || !sections?.length;
  const stacked = !!sections?.length;
  /* tooltips sit on the inline-end side of the rail */
  const tipSide = useLocaleContext().dir === "rtl" ? "left" : "right";
  const active = workspaces.find((w) => w.value === workspace) ?? workspaces[0];

  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    trackModality();
    if (!root.current) return;
    const stops = Array.from(root.current.querySelectorAll<HTMLElement>("[data-slot=sidebar-nav-group]")).map((group) => {
      const layer = group.querySelector<HTMLElement>(":scope > [data-slot=sidebar-nav-highlight]");
      return layer ? glide(group, layer, { rows: "[data-slot=sidebar-nav-item]", follow: "hover" }) : () => {};
    });
    return () => stops.forEach((stop) => stop());
  }, [chats.length > 0, sections?.length ?? 0]);

  const hidden = collapsed ? true : undefined;
  const r = sidebarNav({ collapsed, size });
  const menuItems: MenuEntry[] = [
    { type: "radio-group", name: "workspace", label: "Workspaces", value: workspace, closeOnSelect: true, items: workspaces.map((w) => ({ value: w.value, label: w.label })) },
    { type: "separator" },
    ...actions.map((a): MenuEntry => (a.type === "separator" ? a : { value: a.value, label: a.label, tone: a.tone, icon: a.icon === undefined ? undefined : glyph(a.icon) })),
  ];
  /* primary links (rail: true) have a tooltip in the collapsed rail; links in the chats and the
   * sections are hidden there. A link without an icon is indented to the label column. */
  const link = (item: SidebarNavItem | SidebarNavChat, icon?: SidebarNavIcon, rail = false) => {
    const anchor = (
      <a
        data-slot="sidebar-nav-item"
        className={r.item({ indent: icon === undefined })}
        href={item.href}
        data-value={item.value}
        aria-current={item.value === current ? "page" : undefined}
        aria-label={rail && collapsed ? item.label : undefined}
        title={rail ? undefined : item.label}
        onClick={(event) => { onNavigate?.(item.value, item.href, event); setCurrent(item.value); }}
      >
        {icon !== undefined && <span data-slot="sidebar-nav-item-icon" className={r.itemIcon()} aria-hidden>{glyph(icon)}</span>}
        <span data-slot="sidebar-nav-label" data-sidebar-nav="copy" className={r.label({ class: r.copy() })} aria-hidden={hidden}>{item.label}</span>
        {"badge" in item && item.badge && <Count data-sidebar-nav="copy" className={r.copy({ badge: true })} variant="plain" size="sm" aria-hidden={hidden}>{item.badge}</Count>}
      </a>
    );
    /* an icon link is named by its tooltip in the collapsed rail */
    return (
      <li key={item.value}>
        {rail ? <Tooltip content={item.label} placement={tipSide} disabled={!collapsed}>{anchor}</Tooltip> : anchor}
      </li>
    );
  };

  const chatsSection = showChats ? (
    <Collapsible data-sidebar-nav="section" className={r.section({ stacked })} variant="section" caret="start" label={chatsLabel} open={chatsOpen} onOpenChange={setChatsOpen}>
      {chats.length ? (
        <div data-slot="sidebar-nav-group" className={r.group({ inSection: true })}>
          <span data-slot="sidebar-nav-highlight" className={r.highlight()} aria-hidden />
          <ul data-slot="sidebar-nav-list" className={r.list()}>{chats.map((chat) => link(chat, chat.icon))}</ul>
        </div>
      ) : (
        <EmptyState title={emptyLabel} />
      )}
    </Collapsible>
  ) : null;

  return (
    <nav
      ref={root}
      {...data} data-slot="sidebar-nav"
      className={r.base({ class: className })}
      aria-label={label}
      style={style}
    >
      <div data-slot="sidebar-nav-panel" className={r.panel()}>
        <div data-slot="sidebar-nav-header" className={r.header()}>
          <Menu
            data-sidebar-nav="switcher"
            className={r.switcher()}
            items={menuItems}
            open={menuOpen}
            onOpenChange={setMenuOpen}
            onRadioChange={(name, value) => { if (name === "workspace") setWorkspace(value); }}
            onSelect={(value) => onWorkspaceAction?.(value)}
          >
            <button type="button" data-slot="sidebar-nav-workspace" data-menu="trigger" className={menu().trigger({ class: r.workspace() })}>
              <span data-slot="sidebar-nav-logo" className={r.logo()} aria-hidden>{glyph(logo)}</span>
              <span data-slot="sidebar-nav-workspace-name" data-sidebar-nav="copy" className={r.workspaceName({ class: r.copy() })} title={active?.label} aria-hidden={hidden}>{active?.label}</span>
              <span data-slot="sidebar-nav-caret" data-sidebar-nav="copy" className={r.caret({ class: r.copy() })} aria-hidden><CaretDown data-slot="icon" weight="bold" /></span>
            </button>
          </Menu>
          <Tooltip content={collapsed ? "Expand sidebar" : "Collapse sidebar"} placement={tipSide}>
            <Button
              data-sidebar-nav="toggle"
              className={r.toggle()}
              variant="ghost"
              size="md"
              shape="rounded"
              square
              muted
              iconSize={size === "sm" ? 16 : 18}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              icon={<SidebarSimple data-slot="icon" weight="bold" />}
              onClick={() => { if (!collapsed) setMenuOpen(false); setCollapsed(!collapsed); }}
            />
          </Tooltip>
        </div>
        <div data-slot="sidebar-nav-group" className={r.group()}>
          <span data-slot="sidebar-nav-highlight" className={r.highlight()} aria-hidden />
          <ul data-slot="sidebar-nav-list" className={r.list()}>{items.map((item) => link(item, item.icon, true))}</ul>
        </div>
        <div data-slot="sidebar-nav-sections" className={r.sections({ stacked })}>
          {sections?.map((section) => (
            <Collapsible key={section.value} data-sidebar-nav="section" className={r.section({ stacked })} variant="section" caret="start" label={section.label} defaultOpen>
              {section.items.length > 0 && (
                <div data-slot="sidebar-nav-group" className={r.group({ inSection: true })}>
                  <span data-slot="sidebar-nav-highlight" className={r.highlight()} aria-hidden />
                  <ul data-slot="sidebar-nav-list" className={r.list()}>{section.items.map((item) => link(item, item.icon))}</ul>
                </div>
              )}
            </Collapsible>
          ))}
          {chatsSection}
        </div>
      </div>
    </nav>
  );
}
