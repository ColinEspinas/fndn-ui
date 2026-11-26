<!-- The app's left rail: workspace switcher, links and recent chats; collapses to icons. -->
<script lang="ts">
  import Bell from "phosphor-svelte/lib/BellIcon";
  import BookmarkSimple from "phosphor-svelte/lib/BookmarkSimpleIcon";
  import Calendar from "phosphor-svelte/lib/CalendarIcon";
  import CaretDown from "phosphor-svelte/lib/CaretDownIcon";
  import ChartBar from "phosphor-svelte/lib/ChartBarIcon";
  import ChatCircle from "phosphor-svelte/lib/ChatCircleIcon";
  import Chats from "phosphor-svelte/lib/ChatsIcon";
  import Circle from "phosphor-svelte/lib/CircleIcon";
  import Cube from "phosphor-svelte/lib/CubeIcon";
  import Database from "phosphor-svelte/lib/DatabaseIcon";
  import Folder from "phosphor-svelte/lib/FolderIcon";
  import FolderOpen from "phosphor-svelte/lib/FolderOpenIcon";
  import Gear from "phosphor-svelte/lib/GearIcon";
  import Hash from "phosphor-svelte/lib/HashIcon";
  import House from "phosphor-svelte/lib/HouseIcon";
  import IceCream from "phosphor-svelte/lib/IceCreamIcon";
  import Lightning from "phosphor-svelte/lib/LightningIcon";
  import MagnifyingGlass from "phosphor-svelte/lib/MagnifyingGlassIcon";
  import NotePencil from "phosphor-svelte/lib/NotePencilIcon";
  import Plus from "phosphor-svelte/lib/PlusIcon";
  import RocketLaunch from "phosphor-svelte/lib/RocketLaunchIcon";
  import SidebarSimple from "phosphor-svelte/lib/SidebarSimpleIcon";
  import SignOut from "phosphor-svelte/lib/SignOutIcon";
  import SquaresFour from "phosphor-svelte/lib/SquaresFourIcon";
  import Star from "phosphor-svelte/lib/StarIcon";
  import Storefront from "phosphor-svelte/lib/StorefrontIcon";
  import UserPlus from "phosphor-svelte/lib/UserPlusIcon";
  import Users from "phosphor-svelte/lib/UsersIcon";
  import { useLocaleContext } from "@ark-ui/svelte/locale";
  import type { Component } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import Button from "../button/Button.svelte";
  import Collapsible from "../collapsible/Collapsible.svelte";
  import Count from "../count/Count.svelte";
  import EmptyState from "../empty-state/EmptyState.svelte";
  import Menu, { type MenuEntry } from "../menu/Menu.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { menu } from "../menu/menu.recipe";
  import { sidebarNav } from "./sidebar-nav.recipe";
  import { glide } from "../lib/glide";
  import { trackModality } from "../lib/modality";

  export type SidebarNavIconName =
    | "bell" | "bookmark-simple" | "calendar" | "chart-bar" | "chat-circle" | "chats" | "circle" | "cube" | "database" | "folder" | "folder-open"
    | "gear" | "hash" | "house" | "ice-cream" | "lightning" | "magnifying-glass" | "note-pencil" | "plus" | "rocket-launch" | "sign-out"
    | "squares-four" | "star" | "storefront" | "user-plus" | "users";
  /** A built-in icon name, or any icon component (e.g. a Phosphor icon). */
  export type SidebarNavIcon = SidebarNavIconName | Component<any>;
  export type SidebarNavItem = { value: string; label: string; href: string; icon: SidebarNavIcon; badge?: string };
  /** A link in the chats or a section: an icon is optional (without one, its text lines up with the labels). */
  export type SidebarNavChat = { value: string; label: string; href: string; icon?: SidebarNavIcon };
  export type SidebarNavLink = SidebarNavChat;
  /** A labelled, collapsible group of links under the primary ones (projects, teams). */
  export type SidebarNavSection = { value: string; label: string; items: ReadonlyArray<SidebarNavLink> };
  export type SidebarNavWorkspace = { value: string; label: string };
  export type SidebarNavAction = { type?: "item"; value: string; label: string; icon?: SidebarNavIcon; tone?: "default" | "danger" } | { type: "separator" };

  type Props = {
    workspaces: ReadonlyArray<SidebarNavWorkspace>;
    /** Two-way bindable: <SidebarNav bind:workspace /> */
    workspace?: string;
    /** Menu actions under the workspaces. */
    actions?: ReadonlyArray<SidebarNavAction>;
    /** Primary links, each with an icon. */
    items: ReadonlyArray<SidebarNavItem>;
    /** Labelled groups of links under the primary ones (projects, teams); each folds on its own. */
    sections?: ReadonlyArray<SidebarNavSection>;
    /** Recent chats. Without sections the Chats section is always shown (empty: emptyLabel); with sections, only when chats is given. */
    chats?: ReadonlyArray<SidebarNavChat>;
    /** Two-way bindable: value of the current link (an item or a chat). */
    current?: string;
    /** Two-way bindable. */
    collapsed?: boolean;
    /** Two-way bindable. */
    chatsOpen?: boolean;
    logo?: SidebarNavIcon;
    /** Accessible name of the nav. */
    label?: string;
    chatsLabel?: string;
    emptyLabel?: string;
    /** Row size, dimensions only: md 32px rows, 14px text (default); sm 28px rows, 13px text, for a dense app with 13px content. */
    size?: "sm" | "md";
    onworkspacechange?: (value: string) => void;
    onworkspaceaction?: (value: string) => void;
    oncurrentchange?: (value: string) => void;
    /** A link was followed (before it becomes current); call event.preventDefault() to route in the app. */
    onnavigate?: (value: string, href: string, event: MouseEvent) => void;
    oncollapsedchange?: (collapsed: boolean) => void;
    onchatsopenchange?: (open: boolean) => void;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    workspaces, workspace = $bindable(), items, sections, chats: chatsProp, current = $bindable(), collapsed = $bindable(false), chatsOpen = $bindable(true),
    actions = [
      { value: "new-workspace", label: "New workspace", icon: "plus" },
      { value: "settings", label: "Workspace settings", icon: "gear" },
      { type: "separator" },
      { value: "sign-out", label: "Sign out", icon: "sign-out" },
    ],
    logo = "squares-four", label = "Workspace navigation", chatsLabel = "Chats", emptyLabel = "No chats yet", size = "md",
    onworkspacechange, onworkspaceaction, oncurrentchange, onnavigate, oncollapsedchange, onchatsopenchange, class: className, style, ...data
  }: Props = $props();

  const GLYPHS: Record<SidebarNavIconName, Component<any>> = {
    bell: Bell, "bookmark-simple": BookmarkSimple, calendar: Calendar, "chart-bar": ChartBar, "chat-circle": ChatCircle, chats: Chats,
    circle: Circle, cube: Cube, database: Database, folder: Folder, "folder-open": FolderOpen, gear: Gear, hash: Hash, house: House,
    "ice-cream": IceCream, lightning: Lightning, "magnifying-glass": MagnifyingGlass, "note-pencil": NotePencil, plus: Plus,
    "rocket-launch": RocketLaunch, "sign-out": SignOut, "squares-four": SquaresFour, star: Star, storefront: Storefront, "user-plus": UserPlus, users: Users,
  };
  const glyph = (icon: SidebarNavIcon | undefined): Component<any> | undefined =>
    icon === undefined ? undefined : typeof icon === "string" ? GLYPHS[icon as SidebarNavIconName] : icon;

  const r = $derived(sidebarNav({ collapsed, size }));
  let menuOpen = $state(false);
  /* tooltips sit on the inline-end side of the rail */
  const locale = useLocaleContext();
  const tipSide = $derived(locale().dir === "rtl" ? "left" : "right");
  const selected = $derived(workspace ?? workspaces[0]?.value ?? "");
  const active = $derived(workspaces.find((w) => w.value === selected) ?? workspaces[0]);
  const menuItems = $derived<MenuEntry[]>([
    { type: "radio-group", name: "workspace", label: "Workspaces", value: selected, closeOnSelect: true, items: workspaces.map((w) => ({ value: w.value, label: w.label })) },
    { type: "separator" },
    ...actions.map((a): MenuEntry => (a.type === "separator" ? a : { value: a.value, label: a.label, tone: a.tone, icon: glyph(a.icon) })),
  ]);
  const Logo = $derived(glyph(logo));

  function pickWorkspace(name: string, value: string) {
    if (name !== "workspace") return;
    workspace = value;
    onworkspacechange?.(value);
  }
  const chats = $derived(chatsProp ?? []);
  const showChats = $derived(chatsProp !== undefined || !sections?.length);
  const stacked = $derived(!!sections?.length);
  /* the sections open until folded (their own state); the chats are the chatsOpen model */
  let sectionOpen = $state<Record<string, boolean>>({});
  function follow(value: string, href?: string, event?: MouseEvent) {
    if (href !== undefined && event) onnavigate?.(value, href, event);
    current = value;
    oncurrentchange?.(value);
  }
  function toggleCollapsed() {
    const next = !collapsed;
    if (next) menuOpen = false;
    collapsed = next;
    oncollapsedchange?.(next);
  }
  function setChats(open: boolean) {
    chatsOpen = open;
    onchatsopenchange?.(open);
  }

  let root = $state<HTMLElement | null>(null);
  const hasChats = $derived(chats.length > 0);
  $effect(() => {
    trackModality();
    void hasChats;
    void sections?.length;
    if (!root) return;
    const stops = Array.from(root.querySelectorAll<HTMLElement>("[data-slot=sidebar-nav-group]")).map((group) => {
      const layer = group.querySelector<HTMLElement>(":scope > [data-slot=sidebar-nav-highlight]");
      return layer ? glide(group, layer, { rows: "[data-slot=sidebar-nav-item]", follow: "hover" }) : () => {};
    });
    return () => stops.forEach((stop) => stop());
  });
</script>

{#snippet anchor(item: SidebarNavItem | SidebarNavChat, withIcon: boolean, tip: HTMLAttributes<HTMLElement>)}
  <a
    {...tip}
    data-slot="sidebar-nav-item"
    class={r.item({ indent: item.icon === undefined })}
    href={item.href}
    data-value={item.value}
    aria-current={item.value === current ? "page" : undefined}
    aria-label={withIcon && collapsed ? item.label : undefined}
    title={!withIcon ? item.label : undefined}
    onclick={(e) => { (tip.onclick as ((e: MouseEvent) => void) | undefined)?.(e); follow(item.value, item.href, e); }}
  >
    {#if item.icon !== undefined}{@const Icon = glyph(item.icon)}<span data-slot="sidebar-nav-item-icon" class={r.itemIcon()} aria-hidden="true"><Icon data-slot="icon" weight="bold" /></span>{/if}<span data-slot="sidebar-nav-label" data-sidebar-nav="copy" class={r.label({ class: r.copy() })} aria-hidden={collapsed ? "true" : undefined}>{item.label}</span>{#if "badge" in item && item.badge}<Count data-sidebar-nav="copy" class={r.copy({ badge: true })} variant="plain" size="sm" aria-hidden={collapsed ? "true" : undefined}>{item.badge}</Count>{/if}
  </a>
{/snippet}

<!-- a link in the chats or a section: hidden in the collapsed rail, so no tooltip -->
{#snippet link_(item: SidebarNavChat)}<li>{@render anchor(item, false, {})}</li>{/snippet}

{#snippet link(item: SidebarNavItem | SidebarNavChat, withIcon: boolean)}
  <li>
    {#if withIcon}
      <!-- an icon link is named by its tooltip in the collapsed rail -->
      <Tooltip content={item.label} placement={tipSide} disabled={!collapsed}>
        {#snippet trigger(props)}{@render anchor(item, true, props() as HTMLAttributes<HTMLElement>)}{/snippet}
      </Tooltip>
    {:else}
      {@render anchor(item, false, {})}
    {/if}
  </li>
{/snippet}

<nav bind:this={root} {...data} data-slot="sidebar-nav" class={r.base({ class: className })} aria-label={label} {style}>
  <div data-slot="sidebar-nav-panel" class={r.panel()}>
    <div data-slot="sidebar-nav-header" class={r.header()}>
      <Menu data-sidebar-nav="switcher" class={r.switcher()} items={menuItems} bind:open={menuOpen} onradiochange={pickWorkspace} onselect={(value) => onworkspaceaction?.(value)}>
        {#snippet trigger(props)}
          <button {...props()} type="button" data-slot="sidebar-nav-workspace" data-menu="trigger" class={menu().trigger({ class: r.workspace() })}>
            <span data-slot="sidebar-nav-logo" class={r.logo()} aria-hidden="true"><Logo data-slot="icon" weight="bold" /></span>
            <span data-slot="sidebar-nav-workspace-name" data-sidebar-nav="copy" class={r.workspaceName({ class: r.copy() })} title={active?.label} aria-hidden={collapsed ? "true" : undefined}>{active?.label}</span>
            <span data-slot="sidebar-nav-caret" data-sidebar-nav="copy" class={r.caret({ class: r.copy() })} aria-hidden="true"><CaretDown data-slot="icon" weight="bold" /></span>
          </button>
        {/snippet}
      </Menu>
      <Tooltip content={collapsed ? "Expand sidebar" : "Collapse sidebar"} placement={tipSide}>
        {#snippet trigger(props)}
          <Button
            {...props()}
            data-sidebar-nav="toggle"
            class={r.toggle()}
            variant="ghost"
            size="md"
            shape="rounded"
            square
            muted
            iconSize={size === "sm" ? 16 : 18}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onclick={(e) => { (props().onclick as ((e: MouseEvent) => void) | undefined)?.(e); toggleCollapsed(); }}
          >
            {#snippet icon()}<SidebarSimple data-slot="icon" weight="bold" />{/snippet}
          </Button>
        {/snippet}
      </Tooltip>
    </div>
    <div data-slot="sidebar-nav-group" class={r.group()}>
      <span data-slot="sidebar-nav-highlight" class={r.highlight()} aria-hidden="true"></span>
      <ul data-slot="sidebar-nav-list" class={r.list()}>
        {#each items as item (item.value)}{@render link(item, true)}{/each}
      </ul>
    </div>
    <div data-slot="sidebar-nav-sections" class={r.sections({ stacked })}>
      {#each sections ?? [] as section (section.value)}
        <Collapsible data-sidebar-nav="section" class={r.section({ stacked })} variant="section" caret="start" label={section.label} bind:open={() => sectionOpen[section.value] ?? true, (open) => (sectionOpen[section.value] = open)}>
          {#if section.items.length}
            <div data-slot="sidebar-nav-group" class={r.group({ inSection: true })}>
              <span data-slot="sidebar-nav-highlight" class={r.highlight()} aria-hidden="true"></span>
              <ul data-slot="sidebar-nav-list" class={r.list()}>
                {#each section.items as link (link.value)}{@render link_(link)}{/each}
              </ul>
            </div>
          {/if}
        </Collapsible>
      {/each}
      {#if showChats}
        <Collapsible data-sidebar-nav="section" class={r.section({ stacked })} variant="section" caret="start" label={chatsLabel} open={chatsOpen} onopenchange={setChats}>
          {#if chats.length}
            <div data-slot="sidebar-nav-group" class={r.group({ inSection: true })}>
              <span data-slot="sidebar-nav-highlight" class={r.highlight()} aria-hidden="true"></span>
              <ul data-slot="sidebar-nav-list" class={r.list()}>
                {#each chats as chat (chat.value)}{@render link_(chat)}{/each}
              </ul>
            </div>
          {:else}
            <EmptyState title={emptyLabel} />
          {/if}
        </Collapsible>
      {/if}
    </div>
  </div>
</nav>
