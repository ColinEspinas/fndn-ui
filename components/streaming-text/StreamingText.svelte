<!-- Streamed answer with inline sources, actions and follow-ups. -->
<script lang="ts">
  import ArrowCounterClockwise from "phosphor-svelte/lib/ArrowCounterClockwiseIcon";
  import ArrowElbowDownLeft from "phosphor-svelte/lib/ArrowElbowDownLeftIcon";
  import Copy from "phosphor-svelte/lib/CopyIcon";
  import ThumbsDown from "phosphor-svelte/lib/ThumbsDownIcon";
  import ThumbsUp from "phosphor-svelte/lib/ThumbsUpIcon";
  import { untrack, type Component } from "svelte";
  import type { IconComponentProps } from "phosphor-svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { mergeProps } from "@ark-ui/svelte/utils";
  import Avatar from "../avatar/Avatar.svelte";
  import Button from "../button/Button.svelte";
  import { streamingText } from "./streaming-text.recipe";
  import Collapsible from "../collapsible/Collapsible.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { initialsOf, maxInitials } from "../avatar/avatar.logic";
  import { stallTimer } from "./streaming-text.logic";

  /** One streamed word, or a cite placeholder (index into sources, or true for the first). */
  export type StreamingToken = { text: string; cite?: boolean | number };
  export type StreamingSource = { name: string; domain: string; href: string; image: string };
  export type StreamingAction = "copy" | "retry" | "up" | "down";

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children" | "content"> & {
    /** The tokens streamed so far. The host appends to it and flips `done`. */
    content: StreamingToken[];
    sources?: StreamingSource[];
    followUps?: string[];
    done?: boolean;
    /** Two-way bindable: <StreamingText bind:sourcesOpen /> */
    sourcesOpen?: boolean;
    onsourcesopenchange?: (open: boolean) => void;
    /** Fill the parent width (and drop the reserved height). */
    fill?: boolean;
    sourcesLabel?: string;
    followUpsLabel?: string;
    /** Announced once done. */
    statusLabel?: string;
    onfollowup?: (text: string, index: number) => void;
    onaction?: (action: StreamingAction) => void;
    /** Enter on mount: the caret fades in, cites already streamed pop in, follow-ups of an answer mounted done rise. Off by default; set it on the answer your code adds live, never on one rendered from history or with the page. Cites streamed later and follow-ups that come with done enter either way. */
    appear?: boolean;
  };
  let {
    content, sources = [], followUps = [], done = false, sourcesOpen = $bindable(false), onsourcesopenchange,
    fill = false, sourcesLabel = "Sources", followUpsLabel = "Follow-ups", statusLabel = "Answer complete", onfollowup, onaction, appear = false, class: className, ...rest
  }: Props = $props();

  /* a stream with no new word for a while: the caret blinks until the next one */
  let stalled = $state(false);
  let rootEl = $state<HTMLElement | null>(null);
  const progress = $derived(`${content.length}:${content[content.length - 1]?.text?.length ?? 0}`);
  $effect(() => {
    void progress;
    stalled = false;
    if (done || !rootEl) return;
    return stallTimer(rootEl, () => { stalled = true; });
  });
  const r = $derived(streamingText({ done: !!done, fill: !!fill, stalled: stalled && !done }));
  /* without appear, what is here at mount is simply there; what streams in later enters */
  const atMount = untrack(() => ({ appear, tokens: content.length, done: !!done }));
  const ACTIONS: { key: StreamingAction; label: string; icon: Component<IconComponentProps> }[] = [
    { key: "copy", label: "Copy", icon: Copy },
    { key: "retry", label: "Retry", icon: ArrowCounterClockwise },
    { key: "up", label: "Good answer", icon: ThumbsUp },
    { key: "down", label: "Bad answer", icon: ThumbsDown },
  ];
  const sourceFor = (token: StreamingToken) => sources[token.cite === true ? 0 : (token.cite as number)];
  function toggle(open: boolean) { sourcesOpen = open; onsourcesopenchange?.(open); }
  /* a source's initials under its image (shown while it loads or if it fails) */
  const letters = (s: StreamingSource, size: 12 | 14 | 16) => initialsOf(s.name, maxInitials(size));
</script>

<div bind:this={rootEl} data-slot="streaming-text" class={r.base({ class: className as string | undefined })} aria-busy={done ? undefined : "true"} {...rest}>
  <span data-slot="streaming-text-status" class={r.status()} role="status">{done ? statusLabel : ""}</span>
  <p data-slot="streaming-text-text" class={r.text()}>
    {#each content as token, i (i)}
      {#if token.cite !== undefined && token.cite !== false}
        {@const source = sourceFor(token)}
        {#if source}
          <!-- no whitespace between inline parts: Svelte would keep it as a space -->
          <a data-slot="streaming-text-cite" class={r.cite({ appear: atMount.appear || i >= atMount.tokens })} href={source.href} target="_blank" rel="noreferrer"><Avatar data-streaming-text="cite-avatar" class={r.citeAvatar()} src={source.image} initials={letters(source, 12)} size={12} shape="square" /><span>{source.domain}</span></a>
        {/if}
      {:else}
        <span>{`${token.text} `}</span>
      {/if}
    {/each}<span data-slot="streaming-text-caret" class={r.caret({ appear: atMount.appear, stalled: stalled && !done })} aria-hidden="true"></span>
  </p>

  <div data-slot="streaming-text-actions" class={r.actions()}>
    {#each ACTIONS as a (a.key)}
      <Tooltip content={a.label}>
        {#snippet trigger(props)}
          <Button
            {...mergeProps(props(), { onclick: () => onaction?.(a.key) })}
            class={r.action()}
            data-streaming-text="action"
            variant="ghost"
            size="xs"
            shape="rounded"
            square
            muted
            aria-label={a.label}
            data-action={a.key}
          >{#snippet icon()}<a.icon data-slot="icon" weight="bold" />{/snippet}</Button>
        {/snippet}
      </Tooltip>
    {/each}
    {#if sources.length}
      {#snippet sourcesHeader()}
        <span data-slot="streaming-text-avatars" class={r.avatars()} aria-hidden="true">{#each sources.slice(0, 3) as s, i (i)}<Avatar data-streaming-text="avatar" class={r.avatar()} src={s.image} initials={letters(s, 14)} size={14} shape="round" />{/each}</span>
        <span data-slot="streaming-text-sources-label" class={r.sourcesLabel()}>{sourcesLabel}</span>
      {/snippet}
      <!-- the list opens only once the answer is done -->
      <Collapsible data-streaming-text="sources" class={r.sources()} variant="inline" caret="none" open={done && sourcesOpen} onopenchange={toggle} label={sourcesHeader}>
        <div data-slot="streaming-text-sources-list" class={r.sourcesList()}>
          {#each sources as s, i (i)}
            <a data-slot="streaming-text-source" class={r.source()} href={s.href} target="_blank" rel="noreferrer">
              <Avatar data-streaming-text="source-avatar" class={r.sourceAvatar()} src={s.image} initials={letters(s, 16)} size={16} shape="square" />
              <span data-slot="streaming-text-source-name" class={r.sourceName()} title={s.name}>{s.name}</span>
              <span data-slot="streaming-text-source-domain" class={r.sourceDomain()} title={s.domain}>{s.domain}</span>
            </a>
          {/each}
        </div>
      </Collapsible>
    {/if}
  </div>

  {#if followUps.length}
    <div data-slot="streaming-text-followups" class={r.followups()}>
      <p data-slot="streaming-text-followups-title" class={r.followupsTitle({ appear: atMount.appear || !atMount.done })}>{followUpsLabel}</p>
      <div data-slot="streaming-text-followups-list" class={r.followupsList()}>
        {#each followUps as text, i (i)}
          <button type="button" data-slot="streaming-text-followup" class={r.followup({ appear: atMount.appear || !atMount.done })} style="--fndn-row-index:{i}" onclick={() => onfollowup?.(text, i)}>
            <ArrowElbowDownLeft data-slot="icon" weight="bold" aria-hidden="true" />
            <span data-slot="streaming-text-followup-text" class={r.followupText()}>{text}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
