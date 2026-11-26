<!-- A message that sits in the page. -->
<script lang="ts">
  import CheckCircle from "phosphor-svelte/lib/CheckCircleIcon";
  import Info from "phosphor-svelte/lib/InfoIcon";
  import Warning from "phosphor-svelte/lib/WarningIcon";
  import WarningCircle from "phosphor-svelte/lib/WarningCircleIcon";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import Button from "../button/Button.svelte";
  import { alert } from "./alert.recipe";

  export type AlertTone = "neutral" | "accent" | "green" | "orange" | "red";
  export type AlertActionVariant = "primary" | "outline" | "secondary" | "accent" | "success" | "danger" | "danger-outline" | "ghost";
  export type AlertAction = {
    label: string;
    /** Passed to onaction. Defaults to the label. */
    value?: string;
    variant?: AlertActionVariant;
  };

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "title" | "role"> & {
    /** status-pill's status tones: neutral is the card; the others fill with their tint. */
    tone?: AlertTone;
    title?: string | Snippet;
    /** The tone's icon (default), your own glyph, or false for none. */
    icon?: boolean | Snippet;
    /** Default: alert for orange and red, status otherwise. none: never announced. */
    role?: "alert" | "status" | "none";
    /** Buttons under the text, in order. */
    actions?: ReadonlyArray<AlertAction>;
    onaction?: (value: string) => void;
    /** Your own controls in place of `actions`. */
    action?: Snippet;
    /** The description. */
    children?: Snippet;
    class?: string;
  };

  let { tone = "neutral", title, icon = true, role, actions, onaction, action, class: className, children, ...rest }: Props = $props();

  const ICONS = { neutral: Info, accent: Info, green: CheckCircle, orange: Warning, red: WarningCircle } as const;
  const r = $derived(alert({ tone }));
  const Glyph = $derived(ICONS[tone]);
  const resolvedRole = $derived(role ?? (tone === "orange" || tone === "red" ? "alert" : "status"));
  const hasActions = $derived(action != null || (actions != null && actions.length > 0));
</script>

<div {...rest} data-slot="alert" role={resolvedRole === "none" ? undefined : resolvedRole} class={r.base({ class: className })}>
  {#if icon}
    <span data-slot="alert-icon" class={r.icon()} aria-hidden="true">
      {#if typeof icon === "function"}{@render icon()}{:else}<Glyph data-slot="icon" weight="bold" />{/if}
    </span>
  {/if}
  <div data-slot="alert-content" class={r.content()}>
    {#if title != null && title !== ""}
      <div data-slot="alert-title" class={r.title()}>{#if typeof title === "function"}{@render title()}{:else}{title}{/if}</div>
    {/if}
    {#if children}<div data-slot="alert-description" class={r.description()}>{@render children()}</div>{/if}
    {#if hasActions}
      <div data-slot="alert-actions" class={r.actions()}>
        {#if action}
          {@render action()}
        {:else if actions}
          {#each actions as a (a.value ?? a.label)}
            <Button size="sm" variant={a.variant ?? "outline"} onclick={() => onaction?.(a.value ?? a.label)}>{a.label}</Button>
          {/each}
        {/if}
      </div>
    {/if}
  </div>
</div>
