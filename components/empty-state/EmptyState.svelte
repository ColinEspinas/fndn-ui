<!-- What a list, a table or a popup shows when there is nothing in it. -->
<script lang="ts">
  import Bell from "phosphor-svelte/lib/BellIcon";
  import Chats from "phosphor-svelte/lib/ChatsIcon";
  import CheckCircle from "phosphor-svelte/lib/CheckCircleIcon";
  import GitBranch from "phosphor-svelte/lib/GitBranchIcon";
  import ListChecks from "phosphor-svelte/lib/ListChecksIcon";
  import RocketLaunch from "phosphor-svelte/lib/RocketLaunchIcon";
  import Users from "phosphor-svelte/lib/UsersIcon";
  import File from "phosphor-svelte/lib/FileIcon";
  import FolderOpen from "phosphor-svelte/lib/FolderOpenIcon";
  import Funnel from "phosphor-svelte/lib/FunnelIcon";
  import MagnifyingGlass from "phosphor-svelte/lib/MagnifyingGlassIcon";
  import Table from "phosphor-svelte/lib/TableIcon";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { afterPaint } from "../lib/paint";
  import { emptyState } from "./empty-state.recipe";

  /** The empty-state glyphs, by their names in the icon list (`docs icons`). */
  export type EmptyStateIcon =
    | "magnifying-glass" | "funnel" | "chats" | "folder-open" | "table" | "file"
    | "bell" | "check-circle" | "users" | "rocket-launch" | "list-checks" | "git-branch";

  /* anything else (hidden, id, role, aria-*) lands on the root, so a host can toggle it with hidden */
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
    /** The message. */
    title: string;
    /** Optional next step. */
    hint?: string;
    /** One of the common empty-state glyphs, or a snippet with your own icon. */
    icon?: EmptyStateIcon | Snippet;
    /** row: one line in a list. block: a centred stack for a popup or a table body. */
    size?: "row" | "block";
    /** Rows only: start or centre the line. */
    align?: "start" | "center";
    /** What to do next: a snippet with a Button, under a block's text or at the end of a row. */
    action?: Snippet;
    class?: string;
    style?: string;
  };

  let { title, hint, icon, size = "row", align = "start", action, class: className, ...rest }: Props = $props();

  const ICONS = {
    "magnifying-glass": MagnifyingGlass, funnel: Funnel, chats: Chats, "folder-open": FolderOpen, table: Table, file: File,
    bell: Bell, "check-circle": CheckCircle, users: Users, "rocket-launch": RocketLaunch, "list-checks": ListChecks, "git-branch": GitBranch,
  } satisfies Record<EmptyStateIcon, unknown>;
  /* a name outside the list draws nothing (never the word itself) */
  const Glyph = $derived(typeof icon === "string" ? (ICONS as Record<string, typeof Bell | undefined>)[icon] : undefined);
  const r = $derived(emptyState({ size, align, hint: !!hint }));
  /* no fade with the first paint: data-enter only after it (lib/paint.ts) */
  let enter = $state(false);
  $effect(() => (enter ? undefined : afterPaint(() => { enter = true; })));
</script>

<div data-slot="empty-state" class={r.base({ class: className })} data-enter={enter ? "" : undefined} {...rest}>
  {#if typeof icon === "function" || Glyph}
    <span data-slot="empty-state-icon" class={r.icon()} aria-hidden="true">{#if typeof icon === "function"}{@render icon()}{:else if Glyph}<Glyph data-slot="icon" weight="bold" />{/if}</span>
  {/if}
  <p data-slot="empty-state-title" class={r.title()}>{title}</p>
  {#if hint}<p data-slot="empty-state-hint" class={r.hint()}>{hint}</p>{/if}
  {#if action}<div data-slot="empty-state-action" class={r.action()}>{@render action()}</div>{/if}
</div>
