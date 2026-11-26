<!-- A floating AI toolbar for selected text. Behaviour by Ark UI (Zag popover). -->
<script lang="ts">
  import { Popover as ArkPopover, usePopover } from "@ark-ui/svelte/popover";
  import { Portal } from "@ark-ui/svelte/portal";
  import ArrowClockwise from "phosphor-svelte/lib/ArrowClockwiseIcon";
  import ChatText from "phosphor-svelte/lib/ChatTextIcon";
  import Check from "phosphor-svelte/lib/CheckIcon";
  import CornersIn from "phosphor-svelte/lib/CornersInIcon";
  import ListBullets from "phosphor-svelte/lib/ListBulletsIcon";
  import MagicWand from "phosphor-svelte/lib/MagicWandIcon";
  import PencilSimple from "phosphor-svelte/lib/PencilSimpleIcon";
  import Question from "phosphor-svelte/lib/QuestionIcon";
  import Sparkle from "phosphor-svelte/lib/SparkleIcon";
  import TextAa from "phosphor-svelte/lib/TextAaIcon";
  import X from "phosphor-svelte/lib/XIcon";
  import Button from "../button/Button.svelte";
  import Shimmer from "../shimmer/Shimmer.svelte";
  import Spinner from "../spinner/Spinner.svelte";
  import { selectionActions } from "./selection-actions.recipe";
  import { streamingText } from "../streaming-text/streaming-text.recipe";
  import { trackModality } from "../lib/modality";
  import {
    anchorRect, clearNativeSelection, modeOf, restoreSelection, rovingToolbar, spliceResult, splitText, watchSelection,
    type SelectionAction as Action, type SelectionActionIcon as ActionIcon, type TextRange as SelectedRange,
  } from "./selection-actions.logic";

  /* declared here, not passed on: Svelte exports a type a component declares, and no other */
  export type SelectionAction = Action;
  export type SelectionActionIcon = ActionIcon;
  export type TextRange = SelectedRange;

  type Props = {
    /** Two-way bindable: the passage; Keep writes the result into it. */
    text?: string;
    /** Two-way bindable: { start, end } offsets into text, or null. */
    selection?: TextRange | null;
    /** Two-way bindable: the toolbar is showing. */
    open?: boolean;
    /** Two-way bindable: the action's output, shown in place of the selection. */
    result?: string;
    /** The action is running. */
    busy?: boolean;
    /** Actions offered while idle. */
    actions?: SelectionAction[];
    /** Overrides the status label while busy (an ellipsis is added). */
    busyLabel?: string;
    /** Name of the toolbar. */
    "aria-label"?: string;
    ontextchange?: (text: string) => void;
    onselectionchange?: (selection: TextRange | null) => void;
    onopenchange?: (open: boolean) => void;
    onresultchange?: (result: string) => void;
    /** An action or Try again, with the selected original text. */
    onaction?: (detail: { value: string; text: string }) => void;
    onkeep?: (detail: { text: string; result: string }) => void;
    ondiscard?: () => void;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    text = $bindable(""), selection = $bindable(null), open = $bindable(false), result = $bindable(""), busy = false, actions = [],
    busyLabel, "aria-label": ariaLabel = "Edit selection", ontextchange, onselectionchange, onopenchange, onresultchange,
    onaction, onkeep, ondiscard, class: className, style, ...data
  }: Props = $props();

  const r = selectionActions();
  const ICONS = {
    question: Question, sparkle: Sparkle, "corners-in": CornersIn, "chat-text": ChatText, "text-aa": TextAa,
    "magic-wand": MagicWand, "pencil-simple": PencilSimple, "list-bullets": ListBullets,
  } as const;

  const setText = (v: string) => { text = v; ontextchange?.(v); };
  const setSelection = (v: TextRange | null) => { selection = v; onselectionchange?.(v); };
  const setOpen = (v: boolean) => { if (open === v) return; open = v; onopenchange?.(v); };
  const setResult = (v: string) => { if (result === v) return; result = v; onresultchange?.(v); };

  let last = $state<SelectionAction | null>(null);
  const mode = $derived(modeOf(busy, result));
  const parts = $derived(splitText(text, selection, result));
  const label = $derived(`${busyLabel ?? last?.busyLabel ?? "Editing"}…`);
  const original = $derived(selection ? text.slice(selection.start, selection.end) : "");

  let passage = $state<HTMLElement | null>(null);
  let content = $state<HTMLElement | null>(null);
  let escaped = false;
  let watcher: ReturnType<typeof watchSelection> | null = null;

  /** The toolbar closed by itself: Escape, a press outside, focus leaving. */
  function dismiss() {
    const wasEscape = escaped;
    escaped = false;
    const held = selection;
    const working = mode !== "idle";
    if (working) { setResult(""); ondiscard?.(); }
    setOpen(false);
    /* pressing in the passage starts a new selection: keep the mark until the press ends */
    if (!wasEscape && !working && watcher?.pressedInside()) return;
    setSelection(null);
    if (wasEscape) restoreSelection(passage, held);
  }
  function onSelect(sel: TextRange | null) {
    if (mode !== "idle") return;
    if (!sel) { if (!open) setSelection(null); return; }
    clearNativeSelection();
    setSelection(sel);
    setOpen(true);
  }

  const popover = usePopover(() => ({
    open,
    autoFocus: true,
    restoreFocus: false,
    /* we portal it ourselves; false keeps Zag from redirecting Tab to a trigger there is none of */
    portalled: false,
    positioning: { placement: "bottom", gutter: 8, getAnchorRect: () => anchorRect(passage) },
    onEscapeKeyDown: () => { escaped = true; },
    onOpenChange: (details: { open: boolean }) => { if (!details.open) dismiss(); },
  }));

  $effect(() => {
    trackModality();
    if (!passage || !content) return;
    const w = watchSelection(passage, (sel) => onSelect(sel));
    watcher = w;
    const stop = rovingToolbar(content, () => passage, () => { escaped = true; });
    return () => { w.stop(); stop(); watcher = null; };
  });
  /* the mark grows as the result streams: keep the toolbar under it */
  $effect(() => {
    void [result, mode, selection?.start, selection?.end];
    if (open) popover().reposition();
  });

  function run(action: SelectionAction) {
    last = action;
    onaction?.({ value: action.value, text: original });
  }
  function retry() {
    const value = last?.value ?? actions.find((a) => a.busyLabel)?.value ?? actions[0]?.value ?? "";
    const textNow = original;
    setResult("");
    onaction?.({ value, text: textNow });
  }
  function keep() {
    if (!selection) return;
    const kept = result;
    const next = spliceResult(text, selection, kept);
    setText(next.text);
    setResult("");
    onkeep?.({ text: next.text, result: kept });
    setOpen(false);
    setSelection(null);
    restoreSelection(passage, next.selection);
  }
  function discard() {
    const held = selection;
    setResult("");
    ondiscard?.();
    setOpen(false);
    setSelection(null);
    restoreSelection(passage, held);
  }
</script>

<ArkPopover.RootProvider value={popover}>
  <div {...data} data-slot="selection-actions" class={r.base({ class: className })} {style}>
    <!-- one line: whitespace in here would become passage text and shift the offsets -->
    <ArkPopover.Anchor bind:ref={passage} data-slot="selection-actions-text" class={r.text()} tabindex={-1}>{#if parts}{parts.before}<mark data-slot="selection-actions-mark" class={r.mark({ open })}>{parts.inner}{#if mode === "busy" && result}<span data-slot="streaming-text-caret" class={streamingText().caret()} aria-hidden="true"></span>{/if}</mark>{parts.after}{:else}{text}{/if}</ArkPopover.Anchor>
  </div>
  <Portal>
    <ArkPopover.Positioner data-slot="selection-actions-positioner" class={r.positioner()}>
      <ArkPopover.Content bind:ref={content} data-slot="selection-actions-content" class={r.content()} role="toolbar" aria-label={ariaLabel}>
        {#if mode === "idle"}
          {#each actions as a (a.value)}
            {@const Glyph = ICONS[a.icon ?? "sparkle"]}
            <Button data-selection-actions="action" class={r.action()} variant="ghost" size="sm" data-value={a.value} onclick={() => run(a)}>
              {#snippet icon()}<Glyph data-slot="icon" weight={!a.icon || a.icon === "sparkle" ? "fill" : "bold"} />{/snippet}
              {a.label}
            </Button>
          {/each}
        {:else if mode === "busy"}
          <span data-slot="selection-actions-status" class={r.status()} role="status">
            <Spinner size="sm" decorative />
            {#if result}<span data-slot="selection-actions-label" class={r.label()}>{label}</span>{:else}<Shimmer speed="fast">{label}</Shimmer>{/if}
          </span>
        {:else}
          <Button data-selection-actions="keep" class={r.keep()} variant="primary" size="sm" onclick={keep}>
            {#snippet icon()}<Check data-slot="icon" weight="bold" />{/snippet}
            Keep
          </Button>
          <Button data-selection-actions="discard" class={r.discard()} variant="ghost" size="sm" onclick={discard}>
            {#snippet icon()}<X data-slot="icon" weight="bold" />{/snippet}
            Discard
          </Button>
          <span data-slot="selection-actions-separator" class={r.separator()} aria-hidden="true"></span>
          <Button data-selection-actions="retry" class={r.retry()} variant="ghost" size="sm" square aria-label="Try again" onclick={retry}>
            {#snippet icon()}<ArrowClockwise data-slot="icon" weight="bold" />{/snippet}
          </Button>
        {/if}
      </ArkPopover.Content>
    </ArkPopover.Positioner>
  </Portal>
</ArkPopover.RootProvider>
