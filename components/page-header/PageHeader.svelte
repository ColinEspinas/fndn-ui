<!-- The strip at the top of a screen's content: back link, title, description, actions. -->
<script lang="ts">
  import ArrowLeft from "phosphor-svelte/lib/ArrowLeftIcon";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import Button from "../button/Button.svelte";
  import { pageHeader } from "./page-header.recipe";

  export type PageHeaderBack = { label: string; href?: string };
  export type PageHeaderActionVariant = "primary" | "outline" | "secondary" | "accent" | "success" | "danger" | "danger-outline" | "ghost";
  export type PageHeaderAction = {
    label: string;
    /** Passed to onaction. Defaults to the label. */
    value?: string;
    variant?: PageHeaderActionVariant;
  };

  /* anything else (id, aria-*) lands on the root */
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
    /** The screen's title, a real heading. */
    title: string | Snippet;
    /** One line or two under the title (beside it in a pane): what the screen holds, its state. */
    description?: string | Snippet;
    /** Where "back" goes: a link with an href, a button that calls onback without one. */
    back?: PageHeaderBack;
    /** Called by the back button; given with an href, it replaces the browser's navigation (client
     * routers), and a click with a modifier key keeps the browser's. */
    onback?: (back: PageHeaderBack) => void;
    /** The heading's level, h1 to h6. The size does not change with it. */
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    /** page: a page's title. pane: the one-row header of a pane above a list. */
    size?: "page" | "pane";
    /** At the end of the title's line: your own Buttons (a snippet), or Buttons from data (sm, outline unless given). */
    actions?: Snippet | ReadonlyArray<PageHeaderAction>;
    /** A data action was pressed. */
    onaction?: (value: string) => void;
    class?: string;
  };

  let { title, description, back, onback, level = 1, size = "page", actions, onaction, class: className, ...rest }: Props = $props();

  const r = $derived(pageHeader({ size }));
  /* a level outside 1 to 6 falls back to the nearest one (h7 is not an element) */
  const heading = $derived(`h${Math.min(6, Math.max(1, Math.round(Number(level) || 1)))}`);
  const hasDescription = $derived(description != null && description !== "");
  const hasActions = $derived(typeof actions === "function" || (actions != null && actions.length > 0));

  function follow(e: MouseEvent) {
    if (!onback || !back || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onback(back);
  }
</script>

<div {...rest} data-slot="page-header" class={r.base({ class: className })}>
  {#if back}
    {#if back.href != null}
      <a data-slot="page-header-back" class={r.back()} href={back.href} onclick={follow}><ArrowLeft data-slot="icon" weight="bold" aria-hidden="true" />{back.label}</a>
    {:else}
      <button type="button" data-slot="page-header-back" class={r.back()} onclick={() => onback?.(back)}><ArrowLeft data-slot="icon" weight="bold" aria-hidden="true" />{back.label}</button>
    {/if}
  {/if}
  <div data-slot="page-header-row" class={r.row()}>
    <div data-slot="page-header-text" class={r.text()}>
      <svelte:element this={heading} data-slot="page-header-title" class={r.title()}>{#if typeof title === "function"}{@render title()}{:else}{title}{/if}</svelte:element>
      {#if hasDescription}
        <p data-slot="page-header-description" class={r.description()}>{#if typeof description === "function"}{@render description()}{:else}{description}{/if}</p>
      {/if}
    </div>
    {#if hasActions}
      <div data-slot="page-header-actions" class={r.actions()}>
        {#if typeof actions === "function"}
          {@render actions()}
        {:else if actions}
          {#each actions as a (a.value ?? a.label)}
            <Button size="sm" variant={a.variant ?? "outline"} onclick={() => onaction?.(a.value ?? a.label)}>{a.label}</Button>
          {/each}
        {/if}
      </div>
    {/if}
  </div>
</div>
