<!-- A dark chip that names a control. Behaviour by Ark UI (Zag tooltip). -->
<script lang="ts">
  import { Portal } from "@ark-ui/svelte/portal";
  import { Tooltip as ArkTooltip, useTooltip } from "@ark-ui/svelte/tooltip";
  import { mergeProps } from "@ark-ui/svelte/utils";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import Button from "../button/Button.svelte";
  import Kbd from "../kbd/Kbd.svelte";
  import { tooltip } from "./tooltip.recipe";
  import { trackModality } from "../lib/modality";

  export type TooltipPlacement = "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "right";

  type Props = {
    /** The label. Keep it short; a tooltip never holds interactive content. */
    content: string;
    /** Keyboard shortcut hint, e.g. "⌘C". */
    shortcut?: string;
    placement?: TooltipPlacement;
    /** Milliseconds before the first tooltip opens on hover. Neighbours open at once. */
    openDelay?: number;
    disabled?: boolean | null;
    /** Your own trigger. The snippet receives a function returning the props to spread on your element. */
    trigger?: Snippet<[() => HTMLButtonAttributes]>;
    /** Renders a default Button trigger with this label when no `trigger` is given. */
    triggerLabel?: string;
    onopenchange?: (open: boolean) => void;
    /** Machine id. Generated when omitted. */
    /* null too: an outer trigger's spread props (HTMLButtonAttributes) type it so */
    id?: string | null;
    /** Id of a trigger that another component owns (a menu's), when you merge its props with the
     * tooltip's on one element: the tooltip finds its trigger by it. Set by itself when the Tooltip
     * is the as-child trigger of another component. */
    triggerId?: string;
    /** Anything else (the props of an outer asChild trigger, such as a date picker's: spread them on
     * the Tooltip) goes to the trigger, so a tooltip can wrap the trigger of another component. */
    [prop: string]: unknown;
  };

  let { content, shortcut, placement = "top", openDelay = 400, disabled, trigger, triggerLabel, onopenchange, id, triggerId, ...rest }: Props = $props();

  /* as the as-child trigger of another component (its props are spread here, data-scope among
   * them), `id` is that trigger's id */
  const hosted = $derived(rest["data-scope"] !== undefined);
  const machineId = $derived(hosted ? undefined : (id ?? undefined));
  const ownerId = $derived(triggerId ?? (hosted ? (id ?? undefined) : undefined));
  /* As another component's trigger, `disabled` is that trigger's state (the host engine passes it, a
   * date picker's calendar button for one): it goes on the button, and the tooltip of a disabled
   * control stays closed. Before, the tooltip took it as its own prop and the button never
   * disabled. */
  const outer = $derived({
    ...rest,
    ...(ownerId !== undefined ? { id: ownerId } : {}),
    ...(hosted && disabled !== undefined ? { disabled } : {}),
  });
  /* A press on the trigger cancels a tooltip still waiting out its delay, and none opens again until
   * the pointer leaves: a quick click does not bring the label up over what the click opened (the
   * engine ignores a close while it waits). The state is held here so the open can be refused (the
   * Ark Root would take the engine's open over it, so the machine is made here: useTooltip). */
  let open = $state(false);
  let pressed = false;
  const press = { onpointerdown: () => { pressed = true; }, onpointerleave: () => { pressed = false; } };
  const onOpenChange = (details: { open: boolean }) => {
    if (details.open && pressed) return;
    open = details.open;
    onopenchange?.(details.open);
  };
  /* the tooltip's trigger props merged with the outer trigger's (handlers chained) */
  const triggerProps = (props: () => HTMLButtonAttributes) => () => mergeProps(props(), outer, press) as HTMLButtonAttributes;
  const uid = $props.id();
  const machine = useTooltip(() => ({
    id: machineId ?? uid,
    ids: ownerId ? { trigger: ownerId } : undefined,
    openDelay,
    disabled: disabled ?? false,
    positioning: { placement, gutter: 6 },
    open,
    onOpenChange,
  }));

  const r = tooltip();
  $effect(() => trackModality());
</script>

<ArkTooltip.RootProvider value={machine} lazyMount>
  {#if trigger}
    <ArkTooltip.Trigger>
      {#snippet asChild(props)}{@render trigger(triggerProps(props))}{/snippet}
    </ArkTooltip.Trigger>
  {:else}
    <ArkTooltip.Trigger>
      {#snippet asChild(props)}<Button {...mergeProps(props(), press)} variant="outline" size="sm">{triggerLabel}</Button>{/snippet}
    </ArkTooltip.Trigger>
  {/if}
  <Portal>
    <ArkTooltip.Positioner data-slot="tooltip-positioner" class={r.positioner()}>
      <ArkTooltip.Content data-slot="tooltip" class={r.base()}>
        <span data-slot="tooltip-label" class={r.label()}>{content}</span>
        {#if shortcut}<Kbd data-tooltip="shortcut" class={r.shortcut()} variant="plain" keys={[shortcut]} />{/if}
      </ArkTooltip.Content>
    </ArkTooltip.Positioner>
  </Portal>
</ArkTooltip.RootProvider>
