<script setup lang="ts">
/** The app's left rail: workspace switcher, links and recent chats; collapses to icons. */
import {
  PhBell, PhBookmarkSimple, PhCalendar, PhCaretDown, PhChartBar, PhChatCircle, PhChats, PhCircle, PhCube, PhDatabase, PhFolder, PhFolderOpen, PhGear,
  PhHash, PhHouse, PhIceCream, PhLightning, PhMagnifyingGlass, PhNotePencil, PhPlus, PhRocketLaunch, PhSidebarSimple, PhSignOut, PhSquaresFour,
  PhStar, PhStorefront, PhUserPlus, PhUsers,
} from "@phosphor-icons/vue";
import { useLocaleContext } from "@ark-ui/vue/locale";
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, useAttrs, watch, type Component } from "vue";
import Button from "../button/Button.vue";
import Collapsible from "../collapsible/Collapsible.vue";
import Count from "../count/Count.vue";
import EmptyState from "../empty-state/EmptyState.vue";
import Menu from "../menu/Menu.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import type { MenuEntry } from "../menu/Menu.vue";
import { menu } from "../menu/menu.recipe";
import { sidebarNav } from "./sidebar-nav.recipe";
import { glide } from "../lib/glide";
import { trackModality } from "../lib/modality";

export type SidebarNavIconName =
  | "bell" | "bookmark-simple" | "calendar" | "chart-bar" | "chat-circle" | "chats" | "circle" | "cube" | "database" | "folder" | "folder-open"
  | "gear" | "hash" | "house" | "ice-cream" | "lightning" | "magnifying-glass" | "note-pencil" | "plus" | "rocket-launch" | "sign-out"
  | "squares-four" | "star" | "storefront" | "user-plus" | "users";
/** A built-in icon name, or any icon component (e.g. a Phosphor icon). */
export type SidebarNavIcon = SidebarNavIconName | Component;
export type SidebarNavItem = { value: string; label: string; href: string; icon: SidebarNavIcon; badge?: string };
/** A link in the chats or a section: an icon is optional (without one, its text lines up with the labels). */
export type SidebarNavChat = { value: string; label: string; href: string; icon?: SidebarNavIcon };
export type SidebarNavLink = SidebarNavChat;
/** A labelled, collapsible group of links under the primary ones (projects, teams). */
export type SidebarNavSection = { value: string; label: string; items: ReadonlyArray<SidebarNavLink> };
export type SidebarNavWorkspace = { value: string; label: string };
export type SidebarNavAction = { type?: "item"; value: string; label: string; icon?: SidebarNavIcon; tone?: "default" | "danger" } | { type: "separator" };

/* the caller's class goes through the recipe, so it replaces a conflicting class instead of sitting beside it */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    workspaces: ReadonlyArray<SidebarNavWorkspace>;
    /** Menu actions under the workspaces. */
    actions?: ReadonlyArray<SidebarNavAction>;
    /** Primary links, each with an icon. */
    items: ReadonlyArray<SidebarNavItem>;
    /** Labelled groups of links under the primary ones (projects, teams); each folds on its own. */
    sections?: ReadonlyArray<SidebarNavSection>;
    /** Recent chats. Without sections the Chats section is always shown (empty: emptyLabel); with sections, only when chats is given. */
    chats?: ReadonlyArray<SidebarNavChat>;
    logo?: SidebarNavIcon;
    /** Accessible name of the nav. */
    label?: string;
    chatsLabel?: string;
    emptyLabel?: string;
    /** Row size, dimensions only: md 32px rows, 14px text (default); sm 28px rows, 13px text, for a dense app with 13px content. */
    size?: "sm" | "md";
  }>(),
  {
    actions: () => [
      { value: "new-workspace", label: "New workspace", icon: "plus" },
      { value: "settings", label: "Workspace settings", icon: "gear" },
      { type: "separator" },
      { value: "sign-out", label: "Sign out", icon: "sign-out" },
    ],
    sections: undefined,
    chats: undefined,
    logo: "squares-four",
    label: "Workspace navigation",
    chatsLabel: "Chats",
    emptyLabel: "No chats yet",
    size: "md",
  },
);

/** v-model:workspace, v-model:current, v-model:collapsed, v-model:chatsOpen — local state when unbound. */
const workspace = defineModel<string>("workspace");
const current = defineModel<string>("current");
const collapsed = defineModel<boolean>("collapsed", { default: false });
const r = computed(() => sidebarNav({ collapsed: collapsed.value, size: props.size }));
const chatsOpen = defineModel<boolean>("chatsOpen", { default: true });
const emit = defineEmits<{
  workspaceChange: [value: string];
  workspaceAction: [value: string];
  currentChange: [value: string];
  /** A link was followed (before it becomes current); call event.preventDefault() to route in the app. */
  navigate: [value: string, href: string, event: MouseEvent];
  collapsedChange: [collapsed: boolean];
  chatsOpenChange: [open: boolean];
}>();

const GLYPHS: Record<SidebarNavIconName, Component> = {
  bell: PhBell, "bookmark-simple": PhBookmarkSimple, calendar: PhCalendar, "chart-bar": PhChartBar, "chat-circle": PhChatCircle, chats: PhChats,
  circle: PhCircle, cube: PhCube, database: PhDatabase, folder: PhFolder, "folder-open": PhFolderOpen, gear: PhGear, hash: PhHash, house: PhHouse,
  "ice-cream": PhIceCream, lightning: PhLightning, "magnifying-glass": PhMagnifyingGlass, "note-pencil": PhNotePencil, plus: PhPlus,
  "rocket-launch": PhRocketLaunch, "sign-out": PhSignOut, "squares-four": PhSquaresFour, star: PhStar, storefront: PhStorefront, "user-plus": PhUserPlus, users: PhUsers,
};
const glyph = (icon: SidebarNavIcon | undefined): Component | undefined =>
  icon === undefined ? undefined : typeof icon === "string" ? GLYPHS[icon as SidebarNavIconName] : icon;

const menuOpen = ref(false);
/* tooltips sit on the inline-end side of the rail */
const locale = useLocaleContext();
const tipSide = computed(() => (locale.value?.dir === "rtl" ? "left" : "right"));
const selected = computed(() => workspace.value ?? props.workspaces[0]?.value ?? "");
const active = computed(() => props.workspaces.find((w) => w.value === selected.value) ?? props.workspaces[0]);
const menuItems = computed<MenuEntry[]>(() => [
  { type: "radio-group", name: "workspace", label: "Workspaces", value: selected.value, closeOnSelect: true, items: props.workspaces.map((w) => ({ value: w.value, label: w.label })) },
  { type: "separator" },
  ...props.actions.map((a): MenuEntry => (a.type === "separator" ? a : { value: a.value, label: a.label, tone: a.tone, icon: glyph(a.icon) })),
]);

function pickWorkspace(name: string, value: string) {
  if (name !== "workspace") return;
  workspace.value = value;
  emit("workspaceChange", value);
}
const chats = computed(() => props.chats ?? []);
const showChats = computed(() => props.chats !== undefined || !props.sections?.length);
const stacked = computed(() => !!props.sections?.length);
/* the sections open until folded (their own state); the chats are the chatsOpen model */
const sectionOpen = reactive<Record<string, boolean>>({});
const CHATS = "\u0000chats";
const groups = computed(() => [
  ...(props.sections ?? []).map((s) => ({ key: s.value, label: s.label, items: s.items, open: sectionOpen[s.value] ?? true })),
  ...(showChats.value ? [{ key: CHATS, label: props.chatsLabel, items: chats.value, open: chatsOpen.value }] : []),
]);
function setGroup(key: string, open: boolean) {
  if (key === CHATS) setChats(open);
  else sectionOpen[key] = open;
}
function follow(value: string, href?: string, event?: MouseEvent) {
  if (href !== undefined && event) emit("navigate", value, href, event);
  current.value = value;
  emit("currentChange", value);
}
function toggleCollapsed() {
  const next = !collapsed.value;
  if (next) menuOpen.value = false;
  collapsed.value = next;
  emit("collapsedChange", next);
}
function setChats(next: boolean) {
  chatsOpen.value = next;
  emit("chatsOpenChange", next);
}

const root = ref<HTMLElement | null>(null);
let stops: Array<() => void> = [];
const wire = () => {
  stops.forEach((stop) => stop());
  stops = Array.from(root.value?.querySelectorAll<HTMLElement>("[data-slot=sidebar-nav-group]") ?? []).map((group) => {
    const layer = group.querySelector<HTMLElement>(":scope > [data-slot=sidebar-nav-highlight]");
    return layer ? glide(group, layer, { rows: "[data-slot=sidebar-nav-item]", follow: "hover" }) : () => {};
  });
};
onMounted(() => { trackModality(); wire(); });
watch(() => [chats.value.length > 0, props.sections?.length ?? 0], () => nextTick(wire));
onBeforeUnmount(() => stops.forEach((stop) => stop()));
</script>

<template>
  <nav v-bind="attrs" ref="root" data-slot="sidebar-nav" :class="r.base({ class: attrs.class as string | undefined })" :aria-label="label">
    <div data-slot="sidebar-nav-panel" :class="r.panel()">
      <div data-slot="sidebar-nav-header" :class="r.header()">
        <Menu
          data-sidebar-nav="switcher"
          :class="r.switcher()"
          :items="menuItems"
          v-model:open="menuOpen"
          @radio-change="pickWorkspace"
          @select="(value: string) => emit('workspaceAction', value)"
        >
          <template #trigger>
            <button type="button" data-slot="sidebar-nav-workspace" data-menu="trigger" :class="menu().trigger({ class: r.workspace() })">
              <span data-slot="sidebar-nav-logo" :class="r.logo()" aria-hidden="true"><component :is="glyph(logo)" data-slot="icon" weight="bold" /></span>
              <span data-slot="sidebar-nav-workspace-name" data-sidebar-nav="copy" :class="r.workspaceName({ class: r.copy() })" :title="active?.label" :aria-hidden="collapsed ? 'true' : undefined">{{ active?.label }}</span>
              <span data-slot="sidebar-nav-caret" data-sidebar-nav="copy" :class="r.caret({ class: r.copy() })" aria-hidden="true"><PhCaretDown data-slot="icon" weight="bold" /></span>
            </button>
          </template>
        </Menu>
        <Tooltip :content="collapsed ? 'Expand sidebar' : 'Collapse sidebar'" :placement="tipSide">
          <Button
            data-sidebar-nav="toggle"
            :class="r.toggle()"
            variant="ghost"
            size="md"
            shape="rounded"
            square
            muted
            :icon-size="size === 'sm' ? 16 : 18"
            :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
            @click="toggleCollapsed"
          >
            <template #icon><PhSidebarSimple data-slot="icon" weight="bold" /></template>
          </Button>
        </Tooltip>
      </div>
      <div data-slot="sidebar-nav-group" :class="r.group()">
        <span data-slot="sidebar-nav-highlight" :class="r.highlight()" aria-hidden="true" />
        <ul data-slot="sidebar-nav-list" :class="r.list()">
          <li v-for="item in items" :key="item.value">
            <!-- an icon link is named by its tooltip in the collapsed rail -->
            <Tooltip :content="item.label" :placement="tipSide" :disabled="!collapsed">
              <a
                data-slot="sidebar-nav-item"
                :class="r.item()"
                :href="item.href"
                :data-value="item.value"
                :aria-current="item.value === current ? 'page' : undefined"
                :aria-label="collapsed ? item.label : undefined"
                @click="(event: MouseEvent) => follow(item.value, item.href, event)"
              >
                <span data-slot="sidebar-nav-item-icon" :class="r.itemIcon()" aria-hidden="true"><component :is="glyph(item.icon)" data-slot="icon" weight="bold" /></span>
                <span data-slot="sidebar-nav-label" data-sidebar-nav="copy" :class="r.label({ class: r.copy() })" :aria-hidden="collapsed ? 'true' : undefined">{{ item.label }}</span>
                <Count v-if="item.badge" data-sidebar-nav="copy" :class="r.copy({ badge: true })" variant="plain" size="sm" :aria-hidden="collapsed ? 'true' : undefined">{{ item.badge }}</Count>
              </a>
            </Tooltip>
          </li>
        </ul>
      </div>
      <div data-slot="sidebar-nav-sections" :class="r.sections({ stacked })">
        <Collapsible
          v-for="group in groups"
          :key="group.key"
          data-sidebar-nav="section"
          :class="r.section({ stacked })"
          variant="section"
          caret="start"
          :label="group.label"
          :open="group.open"
          @update:open="(open: boolean) => setGroup(group.key, open)"
        >
          <div v-if="group.items.length" data-slot="sidebar-nav-group" :class="r.group({ inSection: true })">
            <span data-slot="sidebar-nav-highlight" :class="r.highlight()" aria-hidden="true" />
            <ul data-slot="sidebar-nav-list" :class="r.list()">
              <!-- hidden in the collapsed rail, so no tooltip: an icon, or the text indented to the labels -->
              <li v-for="link in group.items" :key="link.value">
                <a
                  data-slot="sidebar-nav-item"
                  :class="r.item({ indent: link.icon === undefined })"
                  :href="link.href"
                  :data-value="link.value"
                  :aria-current="link.value === current ? 'page' : undefined"
                  :title="link.label"
                  @click="(event: MouseEvent) => follow(link.value, link.href, event)"
                >
                  <span v-if="link.icon !== undefined" data-slot="sidebar-nav-item-icon" :class="r.itemIcon()" aria-hidden="true"><component :is="glyph(link.icon)" data-slot="icon" weight="bold" /></span>
                  <span data-slot="sidebar-nav-label" data-sidebar-nav="copy" :class="r.label({ class: r.copy() })" :aria-hidden="collapsed ? 'true' : undefined">{{ link.label }}</span>
                </a>
              </li>
            </ul>
          </div>
          <EmptyState v-else-if="group.key === CHATS" :title="emptyLabel" />
        </Collapsible>
      </div>
    </div>
  </nav>
</template>
