<!-- A framed capture of the agent's screen with its cursor and a recording badge. -->
<script lang="ts">
  import ArrowsOutSimple from "phosphor-svelte/lib/ArrowsOutSimpleIcon";
  import Cursor from "phosphor-svelte/lib/CursorIcon";
  import Button from "../button/Button.svelte";
  import Dialog from "../dialog/Dialog.svelte";
  import Spinner from "../spinner/Spinner.svelte";
  import { agentScreen } from "./agent-screen.recipe";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import {
    agentScreenLabels, agentScreenStatus, cursorValue,
    type AgentScreenCursor, type AgentScreenLabels, type AgentScreenState,
  } from "./agent-screen.logic";

  export type { AgentScreenCursor, AgentScreenLabels, AgentScreenState };

  type Props = {
    /** loading: connecting. live: the agent works, its cursor shows. idle: the cursor hides. */
    state?: AgentScreenState;
    /** Cursor position in percent of the screen ({ x, y }, clamped to 0–100). */
    cursor?: AgentScreenCursor;
    /** Shows the REC badge and adds "Recording" to the status. */
    recording?: boolean;
    /** Caption under the frame; also starts the status text. */
    label?: string;
    /** Text alternative of the frame. Defaults to the label. */
    alt?: string;
    /** Image URL of the agent's screen. Without it a neutral placeholder is drawn. */
    src?: string;
    labels?: Partial<AgentScreenLabels>;
    /** Adds a button (with a tooltip) that opens the screen larger in our dialog. */
    expandable?: boolean;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let { state: screenState = "live", cursor, recording = false, label = "Agent's screen", alt, src, labels, expandable = false, class: className, style, ...data }: Props = $props();
  let open = $state(false);

  const text = $derived(agentScreenLabels(labels));
  const r = $derived(agentScreen({ state: screenState, recording, placeholder: !src }));
  const status = $derived(agentScreenStatus(label, screenState, recording, text));
</script>

{#snippet frame(inViewer: boolean)}
  <div data-slot="agent-screen-frame" class={r.frame({ inViewer })} role="img" aria-label={alt ?? label}>
    {#if src}
      <img data-slot="agent-screen-media" class={r.media()} {src} alt="" />
    {:else}
      <span data-slot="agent-screen-placeholder" class={r.placeholder()} aria-hidden="true">
        <span data-slot="agent-screen-chrome" class={r.chrome()}></span>
        <span data-slot="agent-screen-page" class={r.page()}>{#each [0, 1, 2, 3] as i (i)}<span data-slot="agent-screen-line" class={r.line()}></span>{/each}</span>
      </span>
    {/if}
    <span data-slot="agent-screen-cursor" class={r.cursor()} aria-hidden="true" style:--fndn-agent-screen-cursor={cursorValue(cursor)}><Cursor data-slot="icon" weight="fill" /></span>
    <span data-slot="agent-screen-loading" class={r.loading()} aria-hidden="true">
      <Spinner size="md" decorative />
      <span data-slot="agent-screen-loading-text" class={r.loadingText()}>{text.loading}</span>
    </span>
    <span data-slot="agent-screen-rec" class={r.rec()} aria-hidden="true"><span data-slot="agent-screen-rec-dot" class={r.recDot()}></span>{text.rec}</span>
  </div>
{/snippet}

<figure {...data} data-slot="agent-screen" class={r.base({ class: className })} {style}>
  <span data-slot="agent-screen-status" class={r.status()} role="status">{status}</span>
  {@render frame(false)}
  {#if expandable}
    <Tooltip content={text.expand}>
      {#snippet trigger(props)}
        <Button
          {...props()}
          data-agent-screen="expand"
          class={r.expand()}
          variant="outline"
          size="xs"
          shape="rounded"
          square
          aria-label={text.expand}
          aria-haspopup="dialog"
          onclick={(e) => { (props().onclick as ((e: MouseEvent) => void) | undefined)?.(e); open = true; }}
        >
          {#snippet icon()}<ArrowsOutSimple data-slot="icon" weight="bold" />{/snippet}
        </Button>
      {/snippet}
    </Tooltip>
    <Dialog bind:open title={label} size="lg">
      <div data-slot="agent-screen-viewer" class={r.viewer()}>{@render frame(true)}</div>
    </Dialog>
  {/if}
  <figcaption data-slot="agent-screen-label" class={r.label()} title={label}>{label}</figcaption>
</figure>
