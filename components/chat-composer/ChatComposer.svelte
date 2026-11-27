<!-- A compact chat panel: tab strip, threads, composer. -->
<script lang="ts">
  import ArrowUp from "phosphor-svelte/lib/ArrowUpIcon";
  import Stop from "phosphor-svelte/lib/StopIcon";
  import { tick } from "svelte";
  import Button from "../button/Button.svelte";
  import Message from "../message/Message.svelte";
  import Shimmer from "../shimmer/Shimmer.svelte";
  import { chatComposer } from "./chat-composer.recipe";
  import Tabs from "../tabs/Tabs.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { chatComposerLabels, pressField, timeText, watchThreads, type ChatComposerLabels } from "./chat-composer.logic";
  import { trackModality } from "../lib/modality";
  import { autosize } from "../prompt-bar/prompt-bar.logic";
  import { isSubmitKey } from "../prompt-bar/prompt-suggest";

  export type ChatComposerMessage =
    | { role: "user"; text: string }
    | { role: "agent"; text: string; label?: string; source?: string; time?: string };
  export type ChatComposerTab = { value: string; label?: string; messages?: ChatComposerMessage[] };
  export type ChatComposerSubmit = { value: string; tab: string | null };

  type Props = {
    /** Two-way bindable: <ChatComposer bind:tabs />. Sending appends the user's message to the selected tab. */
    tabs?: ChatComposerTab[];
    /** Two-way bindable: the selected conversation; defaults to the first. */
    tab?: string;
    /** Two-way bindable: the draft. */
    value?: string;
    /** Prompts offered as pills; choosing one puts it in the composer. */
    suggestions?: string[];
    /** The agent is working: status instead of suggestions, send becomes stop. */
    busy?: boolean;
    /** Busy label (an ellipsis is added). */
    status?: string;
    placeholder?: string;
    /** Name of the tab list. */
    "aria-label"?: string;
    onvaluechange?: (value: string) => void;
    ontabchange?: (tab: string) => void;
    ontabschange?: (tabs: ChatComposerTab[]) => void;
    /** Enter or the send button, with the trimmed draft; the composer then clears. */
    onsubmit?: (detail: ChatComposerSubmit) => void;
    onstop?: () => void;
    /** The fixed strings: { message, send, stop, time } ({time} is a step's duration). */
    labels?: Partial<ChatComposerLabels>;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    tabs = $bindable([]), tab = $bindable(), value = $bindable(""), suggestions = [], busy = false, status = "Thinking",
    placeholder = "Write a message…", "aria-label": ariaLabel = "Conversations",
    onvaluechange, ontabchange, ontabschange, onsubmit, onstop, labels, class: className, style, ...data
  }: Props = $props();
  const r = chatComposer();
  const t = $derived(chatComposerLabels(labels));

  const current = $derived(tab ?? tabs[0]?.value);
  const items = $derived(tabs.map((t) => ({ value: t.value, label: t.label ?? t.value })));
  const messagesOf = (v: string) => tabs.find((t) => t.value === v)?.messages ?? [];

  let root = $state<HTMLElement | null>(null);
  let field = $state<HTMLElement | null>(null);
  let input = $state<HTMLTextAreaElement | null>(null);
  let sizing: ReturnType<typeof autosize> | null = null;

  $effect(() => {
    trackModality();
    if (!root || !field || !input) return;
    sizing = autosize(input);
    const stops = [watchThreads(root), pressField(field, input)];
    return () => { stops.forEach((s) => s()); sizing?.stop(); sizing = null; };
  });
  $effect(() => { void value; void tick().then(() => sizing?.update()); });

  function setValue(next: string) {
    value = next;
    onvaluechange?.(next);
  }
  function submit() {
    if (busy) { onstop?.(); return; }
    const text = value.trim();
    if (!text) return;
    const tabValue = current ?? null;
    tabs = tabs.map((t) => (t.value === tabValue ? { ...t, messages: [...(t.messages ?? []), { role: "user" as const, text }] } : t));
    ontabschange?.(tabs);
    onsubmit?.({ value: text, tab: tabValue });
    setValue("");
  }
  function onkeydown(e: KeyboardEvent) {
    if (!isSubmitKey(e)) return;
    e.preventDefault();
    if (!busy) submit();
  }
  async function suggest(text: string) {
    setValue(text);
    await tick();
    if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
  }
</script>

<div bind:this={root} {...data} data-slot="chat-composer" class={r.base({ class: className })} {style}>
  <Tabs data-chat-composer="tabs" fill headerClass="" class={r.tabs()} aria-label={ariaLabel} {items} value={current} onvaluechange={(next) => { tab = next; ontabchange?.(next); }}>
    {#snippet panel({ item })}
      <div data-slot="chat-composer-thread" class={r.thread()} role="log">
        {#each messagesOf(item.value) as m, i (i)}
          {#if m.role === "user"}
            <Message data-chat-composer="message" class={r.message()} role="user" text={m.text} />
          {:else}
            <Message data-chat-composer="message" class={r.message()} role="assistant" name={m.label} source={m.source} time={m.time ? timeText(m.time, t) : undefined} text={m.text} />
          {/if}
        {/each}
      </div>
    {/snippet}
  </Tabs>
  <div data-slot="chat-composer-composer" class={r.composer()}>
    {#if busy}
      <div data-slot="chat-composer-status" class={r.status()} role="status"><Shimmer speed="fast">{`${status}…`}</Shimmer></div>
    {:else if suggestions.length}
      <div data-slot="chat-composer-suggestions" class={r.suggestions()}>
        {#each suggestions as s, i (i)}
          <Button data-chat-composer="suggestion" class={r.suggestion()} variant="outline" size="sm" title={s} onclick={() => suggest(s)}>{s}</Button>
        {/each}
      </div>
    {/if}
    <div bind:this={field} data-slot="chat-composer-field" class={r.field()}>
      <textarea
        bind:this={input}
        data-slot="chat-composer-input" class={r.input()}
        rows="1"
        aria-label={t.message}
        {placeholder}
        enterkeyhint="send"
        {value}
        oninput={(e) => setValue(e.currentTarget.value)}
        {onkeydown}
      ></textarea>
      <div data-slot="chat-composer-footer" class={r.footer()}>
        <Tooltip content={busy ? t.stop : t.send}>
          {#snippet trigger(props)}
            <Button
              {...props()}
              data-chat-composer="send"
              class={r.send()}
              variant="primary"
              size="sm"
              square
              aria-label={busy ? t.stop : t.send}
              disabled={!busy && !value.trim()}
              onclick={(e) => { (props().onclick as ((e: MouseEvent) => void) | undefined)?.(e); submit(); }}
            >
              {#snippet icon()}{#if busy}<Stop data-slot="icon" weight="fill" />{:else}<ArrowUp data-slot="icon" weight="bold" />{/if}{/snippet}
            </Button>
          {/snippet}
        </Tooltip>
      </div>
    </div>
  </div>
</div>
