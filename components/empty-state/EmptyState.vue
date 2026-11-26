<script setup lang="ts">
/** What a list, a table or a popup shows when there is nothing in it. */
import { PhBell, PhChats, PhCheckCircle, PhFile, PhFolderOpen, PhFunnel, PhGitBranch, PhListChecks, PhMagnifyingGlass, PhRocketLaunch, PhTable, PhUsers } from "@phosphor-icons/vue";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, useSlots } from "vue";
import { afterPaint } from "../lib/paint";
import { emptyState } from "./empty-state.recipe";

/** The empty-state glyphs, by their names in the icon list (`docs icons`). */
export type EmptyStateIcon =
  | "magnifying-glass" | "funnel" | "chats" | "folder-open" | "table" | "file"
  | "bell" | "check-circle" | "users" | "rocket-launch" | "list-checks" | "git-branch";

/* the caller's class goes through the recipe; anything else (hidden, id, role, aria-*) lands on the root */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** The message. */
    title: string;
    /** Optional next step. */
    hint?: string;
    /** One of the common empty-state glyphs (or use the `icon` slot). */
    icon?: EmptyStateIcon;
    /** row: one line in a list. block: a centred stack for a popup or a table body. */
    size?: "row" | "block";
    /** Rows only: start or centre the line. */
    align?: "start" | "center";
  }>(),
  { size: "row", align: "start" },
);
/** icon: your own icon; action: what to do next (a Button), under a block's text or at the end of a row */
defineSlots<{ icon?: () => unknown; action?: () => unknown }>();
const slots = useSlots();
const ICONS = {
  "magnifying-glass": PhMagnifyingGlass, funnel: PhFunnel, chats: PhChats, "folder-open": PhFolderOpen, table: PhTable, file: PhFile,
  bell: PhBell, "check-circle": PhCheckCircle, users: PhUsers, "rocket-launch": PhRocketLaunch, "list-checks": PhListChecks, "git-branch": PhGitBranch,
} satisfies Record<EmptyStateIcon, unknown>;
/* a name outside the list draws nothing (never the word itself) */
const glyph = computed(() => (props.icon ? (ICONS as Record<string, typeof PhBell | undefined>)[props.icon] : undefined));
const r = computed(() => emptyState({ size: props.size, align: props.align, hint: !!props.hint }));
/* no fade with the first paint: data-enter only after it (lib/paint.ts) */
const enter = ref(false);
let cancel = () => {};
onMounted(() => { cancel = afterPaint(() => { enter.value = true; }); });
onBeforeUnmount(() => cancel());
</script>

<template>
  <div v-bind="attrs" data-slot="empty-state" :class="r.base({ class: attrs.class as string | undefined })" :data-enter="enter ? '' : undefined">
    <span v-if="glyph || slots.icon" data-slot="empty-state-icon" :class="r.icon()" aria-hidden="true"><slot name="icon"><component :is="glyph" data-slot="icon" weight="bold" /></slot></span>
    <p data-slot="empty-state-title" :class="r.title()">{{ title }}</p>
    <p v-if="hint" data-slot="empty-state-hint" :class="r.hint()">{{ hint }}</p>
    <div v-if="slots.action" data-slot="empty-state-action" :class="r.action()"><slot name="action" /></div>
  </div>
</template>
