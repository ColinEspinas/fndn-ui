<!-- One message of a conversation. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import ArrowClockwise from "phosphor-svelte/lib/ArrowClockwiseIcon";
  import Check from "phosphor-svelte/lib/CheckIcon";
  import Copy from "phosphor-svelte/lib/CopyIcon";
  import PencilSimple from "phosphor-svelte/lib/PencilSimpleIcon";
  import ThumbsDown from "phosphor-svelte/lib/ThumbsDownIcon";
  import ThumbsUp from "phosphor-svelte/lib/ThumbsUpIcon";
  import Avatar from "../avatar/Avatar.svelte";
  import Button from "../button/Button.svelte";
  import Chip from "../chip/Chip.svelte";
  import { message } from "./message.recipe";
  import Shimmer from "../shimmer/Shimmer.svelte";
  import Toggle from "../toggle/Toggle.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { createCopier, messageLabels, orderActions, type MessageAction as Action, type MessageFeedback as Feedback, type MessageLabels as Labels } from "./message.logic";
  import { trackModality } from "../lib/modality";

  export type MessageAction = Action;
  export type MessageFeedback = Feedback;
  export type MessageLabels = Labels;

  type Props = Omit<HTMLAttributes<HTMLElement>, "children" | "role"> & {
    /** user: the person's, a bubble at the end. assistant: plain text at the start. */
    role?: "user" | "assistant";
    /** Who wrote it, in the header. */
    name?: string;
    /** Shown beside the header: true for the name's initials, or an image URL. */
    avatar?: boolean | string;
    /** Where it came from, as a neutral Chip after the name (a file, a tool, a page). */
    source?: string;
    /** When, as shown ("2 min ago", "10:42"). */
    time?: string;
    /** The time as a machine-readable date (the <time> element's datetime). */
    datetime?: string;
    /** Plain text. For rich content (streaming text, tool chips, a code block) pass children instead. */
    text?: string;
    children?: Snippet;
    /** Still being written: aria-busy, no actions, and a "Thinking…" status while there is nothing yet. */
    streaming?: boolean;
    /** The actions offered under it, shown on hover and focus (always on touch). */
    actions?: MessageAction[];
    /** What Copy puts on the clipboard; defaults to text. */
    copyText?: string;
    /** Two-way bindable: <Message bind:feedback /> (Good / Bad response). */
    feedback?: MessageFeedback;
    onfeedbackchange?: (feedback: MessageFeedback) => void;
    /** An action was pressed (Copy after it copied). */
    onaction?: (action: MessageAction) => void;
    labels?: Partial<MessageLabels>;
  };

  let {
    role = "assistant", name, avatar = false, source, time, datetime, text, children, streaming = false, actions = [], copyText,
    feedback = $bindable(null), onfeedbackchange, onaction, labels, class: className, ...rest
  }: Props = $props();

  const t = $derived(messageLabels(labels));
  const r = $derived(message({ role, kept: feedback != null }));
  const hasContent = $derived((text != null && text !== "") || !!children);
  const shown = $derived(streaming ? [] : orderActions(actions));
  function setFeedback(next: MessageFeedback) { feedback = next; onfeedbackchange?.(next); }

  let copied = $state(false);
  const copier = createCopier((value) => { copied = value; });
  async function copy() { if (await copier.copy(copyText ?? text ?? "")) onaction?.("copy"); }
  $effect(() => { trackModality(); return () => copier.stop(); });
</script>

<article data-slot="message" class={r.base({ class: className as string | undefined })} aria-busy={streaming || undefined} {...rest}>
  {#if avatar}<Avatar data-message="avatar" class={r.avatar()} size={20} {name} src={typeof avatar === "string" ? avatar : undefined} />{/if}
  <div data-slot="message-main" class={r.main()}>
    {#if name || source || time}
      <div data-slot="message-header" class={r.header()}>
        {#if name}<span data-slot="message-name" class={r.name()} title={name}>{name}</span>{/if}
        {#if source}<Chip data-message="source" class={r.source()} title={source}>{source}</Chip>{/if}
        {#if time}<time data-slot="message-time" class={r.time()} {datetime}>{time}</time>{/if}
      </div>
    {/if}
    <div data-slot="message-body" class={r.body()}>
      {#if text != null && text !== ""}<p data-slot="message-text" class={r.text()}>{text}</p>{:else}{@render children?.()}{/if}
      {#if streaming && !hasContent}<div data-slot="message-status" class={r.status()} role="status"><Shimmer speed="fast">{`${t.thinking}…`}</Shimmer></div>{/if}
    </div>
    {#if shown.length}
      <div data-slot="message-actions" class={r.actions()} role="group" aria-label={t.actions}>
        {#each shown as action (action)}
          {#if action === "copy"}
            <Tooltip content={copied ? t.copied : t.copy}>
              {#snippet trigger(props)}
                <Button {...props()} variant="ghost" size="xs" shape="rounded" square muted swapped={copied} aria-label={t.copy} onclick={copy}>
                  {#snippet icon()}<Copy data-slot="icon" weight="bold" /><Check data-slot="icon" weight="bold" />{/snippet}
                </Button>
              {/snippet}
            </Tooltip>
          {:else if action === "retry" || action === "edit"}
            <Tooltip content={t[action]}>
              {#snippet trigger(props)}
                <Button {...props()} variant="ghost" size="xs" shape="rounded" square muted aria-label={t[action]} onclick={() => onaction?.(action)}>
                  {#snippet icon()}{#if action === "retry"}<ArrowClockwise data-slot="icon" weight="bold" />{:else}<PencilSimple data-slot="icon" weight="bold" />{/if}{/snippet}
                </Button>
              {/snippet}
            </Tooltip>
          {:else}
            <Toggle
              variant="ghost" size="xs" shape="rounded" square muted tooltip={action === "good" ? t.good : t.bad}
              bind:pressed={() => feedback === action, (on) => { setFeedback(on ? action : null); onaction?.(action); }}
            >
              {#snippet icon()}{#if action === "good"}<ThumbsUp data-slot="icon" weight={feedback === "good" ? "fill" : "bold"} />{:else}<ThumbsDown data-slot="icon" weight={feedback === "bad" ? "fill" : "bold"} />{/if}{/snippet}
            </Toggle>
          {/if}
        {/each}
        {#if shown.includes("copy")}<span data-slot="message-announce" class="sr-only" role="status">{copied ? t.copied : ""}</span>{/if}
      </div>
    {/if}
  </div>
</article>
