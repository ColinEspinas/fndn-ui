<!-- The composer of an agent surface. -->
<script lang="ts">
  import { Portal } from "@ark-ui/svelte/portal";
  import ArrowUp from "phosphor-svelte/lib/ArrowUpIcon";
  import At from "phosphor-svelte/lib/AtIcon";
  import ChartBar from "phosphor-svelte/lib/ChartBarIcon";
  import ChatCircle from "phosphor-svelte/lib/ChatCircleIcon";
  import Database from "phosphor-svelte/lib/DatabaseIcon";
  import EnvelopeSimple from "phosphor-svelte/lib/EnvelopeSimpleIcon";
  import FileGlyph from "phosphor-svelte/lib/FileIcon";
  import FileText from "phosphor-svelte/lib/FileTextIcon";
  import Folder from "phosphor-svelte/lib/FolderIcon";
  import Globe from "phosphor-svelte/lib/GlobeIcon";
  import LinkGlyph from "phosphor-svelte/lib/LinkIcon";
  import Microphone from "phosphor-svelte/lib/MicrophoneIcon";
  import Paperclip from "phosphor-svelte/lib/PaperclipIcon";
  import Plus from "phosphor-svelte/lib/PlusIcon";
  import Stack from "phosphor-svelte/lib/StackIcon";
  import Stop from "phosphor-svelte/lib/StopIcon";
  import Users from "phosphor-svelte/lib/UsersIcon";
  import { tick, type Component } from "svelte";
  import Button from "../button/Button.svelte";
  import { button } from "../button/button.recipe";
  import { promptBar } from "./prompt-bar.recipe";
  import Menu, { type MenuEntry } from "../menu/Menu.svelte";
  import Select from "../select/Select.svelte";
  import EmptyState from "../empty-state/EmptyState.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import Tag from "../tag/Tag.svelte";
  import { mergeProps } from "@ark-ui/svelte/utils";
  import { glide } from "../lib/glide";
  import { looksLikePath, middleTruncation, truncationTitles } from "../lib/truncate";
  import { trackModality } from "../lib/modality";
  import { autosize, flipRow, focusAfterRemove, sweep, wideLayout } from "./prompt-bar.logic";
  import {
    applySuggestion, filterOptions, insertionFor, isSubmitKey, parseToken, placeList, revealOption, suggestKey, type SuggestKind,
  } from "./prompt-suggest";

  export type PromptBarSourceIcon = "database" | "chart-bar" | "stack" | "globe" | "file-text" | "folder" | "link" | "users" | "envelope-simple" | "chat-circle" | "at";
  export type PromptBarModel = { value: string; label: string; meta?: string };
  export type PromptBarSource = { value: string; label: string; description?: string; icon?: PromptBarSourceIcon };
  export type PromptBarCommand = { value: string; label?: string; description?: string };
  export type PromptBarAttachment = string | { name: string };
  export type PromptBarSubmit = { value: string; model: string | null; attachments: PromptBarAttachment[] };

  type Props = {
    /** Radius only. rounded: card radius. pill: fully round while it is one line. */
    shape?: "pill" | "rounded";
    /** Two-way bindable: <PromptBar bind:value /> */
    value?: string;
    placeholder?: string;
    /** Two-way bindable */
    model?: string | null;
    models?: ReadonlyArray<PromptBarModel>;
    /** Typing @ lists them; also listed in the attach menu. */
    sources?: ReadonlyArray<PromptBarSource>;
    /** Typing / lists them. */
    commands?: ReadonlyArray<PromptBarCommand>;
    /** Two-way bindable */
    attachments?: ReadonlyArray<PromptBarAttachment>;
    /** Two-way bindable */
    dictating?: boolean;
    /** The agent is working: send becomes stop, Enter does not send. */
    busy?: boolean;
    onvaluechange?: (value: string) => void;
    onmodelchange?: (model: string) => void;
    onattachmentschange?: (attachments: PromptBarAttachment[]) => void;
    ondictatingchange?: (dictating: boolean) => void;
    onsubmit?: (detail: PromptBarSubmit) => void;
    onstop?: () => void;
    onattach?: () => void;
    "aria-label"?: string;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    shape = "rounded", value = $bindable(""), placeholder = "Write a message…", model = $bindable(null), models = [], sources = [], commands = [],
    attachments = $bindable([]), dictating = $bindable(false), busy = false,
    onvaluechange, onmodelchange, onattachmentschange, ondictatingchange, onsubmit, onstop, onattach,
    "aria-label": ariaLabel = "Prompt", class: className, style, ...data
  }: Props = $props();

  const GLYPHS: Record<PromptBarSourceIcon, Component<any>> = {
    database: Database, "chart-bar": ChartBar, stack: Stack, globe: Globe, "file-text": FileText, folder: Folder,
    link: LinkGlyph, users: Users, "envelope-simple": EnvelopeSimple, "chat-circle": ChatCircle, at: At,
  };
  const glyph = (icon: PromptBarSourceIcon | undefined) => GLYPHS[icon ?? "at"] ?? At;
  const nameOf = (a: PromptBarAttachment) => (typeof a === "string" ? a : a.name);

  const id = $props.id();
  let caret = $state(value.length);
  let dismissed = $state(false);
  let active = $state(0);
  let expanded = $state(false);
  const currentModel = $derived(model ?? models[0]?.value ?? null);

  let root = $state<HTMLElement | null>(null);
  let composer = $state<HTMLElement | null>(null);
  let row = $state<HTMLElement | null>(null);
  let input = $state<HTMLTextAreaElement | null>(null);
  let canvas = $state<HTMLCanvasElement | null>(null);
  let positioners = $state<Record<SuggestKind, HTMLElement | null>>({ source: null, command: null });
  let listboxes = $state<Record<SuggestKind, HTMLElement | null>>({ source: null, command: null });
  let highlights = $state<Record<SuggestKind, HTMLElement | null>>({ source: null, command: null });

  type Option = { value: string; label: string; description?: string; icon?: PromptBarSourceIcon };
  const optionsOf = (kind: SuggestKind): Option[] =>
    kind === "source" ? sources.map((s) => ({ ...s })) : commands.map((c) => ({ ...c, label: (c.label ?? `/${c.value}`).replace(/^\//, "") }));
  const shownLabel = (kind: SuggestKind, option: Option, i: number) => (kind === "source" ? option.label : commands[i]!.label ?? `/${commands[i]!.value}`);

  const token = $derived(dismissed ? null : parseToken(value, caret));
  const openKind = $derived<SuggestKind | null>(token && (token.kind === "source" ? sources.length : commands.length) ? token.kind : null);
  const visible = $derived(openKind && token ? filterOptions(openKind, token.query, optionsOf(openKind)) : []);
  const activeIndex = $derived(Math.min(active, Math.max(visible.length - 1, 0)));
  const optionId = (kind: SuggestKind, index: number) => `${id}-${kind}-${index}`;
  const activeId = $derived.by(() => {
    if (!openKind || !visible.length) return undefined;
    const target = visible[activeIndex]!.value;
    return optionId(openKind, optionsOf(openKind).findIndex((o) => o.value === target));
  });
  const canSend = $derived(value.trim().length > 0 || attachments.length > 0);
  /* the buttons follow the bar's shape (radius only) */
  /* the buttons follow the bar's shape (radius only) */
  const btnShape = $derived(shape === "rounded" ? "rounded" : "pill");
  const r = $derived(promptBar({ shape, expanded }));
  /* the button recipe on a <button> of our own: the level bars must be its direct flex item */
  const dictateButton = $derived(button({ variant: "ghost", size: "sm", shape: btnShape, square: true, muted: true }));
  const sendLabel = $derived(busy ? "Stop generating" : "Send");
  const dictateLabel = $derived(dictating ? "Stop dictation" : "Start dictation");

  const lists = $derived((["source", "command"] as const).map((kind) => {
    const all = optionsOf(kind);
    const open = openKind === kind;
    const shown = new Set(open ? visible.map((o) => o.value) : all.map((o) => o.value));
    let index = -1;
    const rows = all.map((option, i) => {
      const isShown = shown.has(option.value);
      if (isShown) index++;
      return { option, i, isShown, position: index, on: open && isShown && index === activeIndex };
    });
    return {
      kind, open, rows,
      label: kind === "source" ? "Sources" : "Commands",
      footer: kind === "source" ? "Type to search sources" : "Type to search commands",
    };
  }));

  const menuItems = $derived<MenuEntry[]>([
    { value: "attach-files", label: "Add photos & files", icon: Paperclip },
    ...(sources.length ? [{ type: "separator" } as const] : []),
    ...sources.map((s) => ({ value: `source:${s.value}`, label: s.label, icon: glyph(s.icon) })),
  ]);

  /* the textarea is driven through the DOM, so every target renders the same markup */
  let nextCaret: number | null = null;
  let sizing: ReturnType<typeof autosize> | null = null;
  $effect(() => {
    const el = input;
    const text = value;
    if (!el) return;
    if (el.value !== text) el.value = text;
    if (nextCaret !== null && document.activeElement === el) el.setSelectionRange(nextCaret, nextCaret);
    nextCaret = null;
    expanded = wideLayout(row, el, text);
    sizing?.update();
  });

  function setValue(next: string, at = next.length) {
    caret = at;
    nextCaret = at;
    if (next !== value) {
      value = next;
      onvaluechange?.(next);
    }
  }
  function setAttachments(next: PromptBarAttachment[]) {
    attachments = next;
    onattachmentschange?.(next);
  }
  function accept(index: number) {
    const option = visible[index];
    if (!openKind || !token || !option) return;
    const next = applySuggestion(value, token, insertionFor(openKind, option));
    dismissed = false;
    active = 0;
    setValue(next.value, next.caret);
    input?.focus();
  }
  function submit() {
    if (busy) { onstop?.(); return; }
    if (!canSend) return;
    onsubmit?.({ value, model: currentModel, attachments: [...attachments] });
    void sweep(canvas, !!root && getComputedStyle(root).direction === "rtl");
    if (attachments.length) setAttachments([]);
    dismissed = false;
    setValue("");
  }
  function syncCaret() {
    const at = input?.selectionStart ?? value.length;
    if (at !== caret) caret = at;
  }
  function onInput(e: Event) {
    const el = e.currentTarget as HTMLTextAreaElement;
    dismissed = false;
    active = 0;
    setValue(el.value, el.selectionStart ?? el.value.length);
  }
  function onKeyDown(e: KeyboardEvent) {
    const action = suggestKey(e, !!openKind, visible.length, activeIndex);
    if (action) {
      e.preventDefault();
      if (action.type === "move") active = action.index;
      else if (action.type === "accept") accept(action.index);
      else dismissed = true;
      return;
    }
    if (isSubmitKey(e)) { e.preventDefault(); if (!busy) submit(); }
  }
  function onKeyUp(e: KeyboardEvent) { if (!["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"].includes(e.key)) syncCaret(); }
  function onModel(next: string | null) {
    if (!next) return;
    model = next;
    onmodelchange?.(next);
  }
  function onDictate() {
    dictating = !dictating;
    ondictatingchange?.(dictating);
  }
  function onMenuSelect(picked: string) {
    if (picked === "attach-files") { onattach?.(); return; }
    const source = sources.find((s) => `source:${s.value}` === picked);
    if (!source) return;
    const glue = value && !/\s$/.test(value) ? " " : "";
    setValue(`${value}${glue}${insertionFor("source", source)}`);
    /* the menu hands focus back to its trigger as it closes; take it on to the textarea */
    setTimeout(() => { if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); } }, 0);
  }
  function removeAttachment(index: number) {
    setAttachments(attachments.filter((_, i) => i !== index));
    /* keep focus in the bar: the chip that takes this one's place, else the textarea */
    void tick().then(() => focusAfterRemove(root, index, input));
  }

  $effect(() => {
    trackModality();
    const stops = (["source", "command"] as const).map((kind) => {
      const box = listboxes[kind];
      const layer = highlights[kind];
      return box && layer ? glide(box, layer, { rows: "[data-slot=prompt-bar-option]", follow: "highlighted" }) : () => {};
    });
    /* a description cut by its ellipsis (it gives way to the label) carries its full text as a title */
    for (const kind of ["source", "command"] as const) stops.push(truncationTitles(listboxes[kind], "[data-slot=prompt-bar-option-description]"));
    return () => stops.forEach((s) => s());
  });
  $effect(() => {
    /* an attachment named by a file is cut in the middle, so its extension stays (full name in title) */
    return middleTruncation(composer, "[data-prompt-bar=attachment] > [data-slot=tag-label]", { when: looksLikePath });
  });
  $effect(() => {
    if (!input) return;
    const s = autosize(input);
    sizing = s;
    return () => { s.stop(); sizing = null; };
  });
  $effect(() => {
    const kind = openKind;
    const anchor = composer;
    const positioner = kind ? positioners[kind] : null;
    if (!kind || !anchor || !positioner) return;
    return placeList(anchor, positioner);
  });
  $effect(() => {
    const kind = openKind;
    const target = activeId;
    if (kind) void tick().then(() => revealOption(listboxes[kind], target));
  });
  /* the layout switch travels: the controls glide to their new row and the composer grows with them */
  $effect(() => {
    if (row && composer) return flipRow(row, composer);
  });
  $effect(() => {
    if (!row || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => { expanded = wideLayout(row, input, value); });
    observer.observe(row);
    return () => observer.disconnect();
  });
</script>

<div
  bind:this={root}
  {...data} data-slot="prompt-bar"
  class={r.base({ class: className })}
  {style}
>
  <div bind:this={composer} data-slot="prompt-bar-composer" class={r.composer()}>
    <canvas bind:this={canvas} data-slot="prompt-bar-sweep" class={r.sweep()} aria-hidden="true"></canvas>
    {#if attachments.length}
      <div data-slot="prompt-bar-attachments" class={r.attachments()} role="list" aria-label="Attachments">
        {#each attachments as a, i (`${nameOf(a)}-${i}`)}
          <Tag data-prompt-bar="attachment" class={r.attachment()} tone="neutral" shape={shape === "pill" ? "pill" : "rounded"} role="listitem"
            removable removeLabel={`Remove ${nameOf(a)}`} removeTooltip={`Remove ${nameOf(a)}`} removeProps={{ "data-prompt-bar": "attachment-remove" }} onremove={() => removeAttachment(i)}>
            {#snippet icon()}<FileGlyph data-slot="icon" weight="bold" />{/snippet}
            {nameOf(a)}
          </Tag>
        {/each}
      </div>
    {/if}
    <div bind:this={row} data-slot="prompt-bar-row" class={r.row()}>
      <Menu data-prompt-bar="attach" class={r.attach()} placement="top-start" items={menuItems} onselect={onMenuSelect}>
        {#snippet trigger(menuProps)}
          <Tooltip content="Add attachments and sources" triggerId={menuProps().id ?? undefined}>
            {#snippet trigger(tipProps)}
              <Button {...mergeProps(tipProps(), menuProps())} data-menu="trigger" data-prompt-bar="attach-trigger" class={r.attachTrigger()} variant="ghost" size="sm" shape={btnShape} square muted aria-label="Add attachments and sources">
                {#snippet icon()}<Plus data-slot="icon" weight="bold" />{/snippet}
              </Button>
            {/snippet}
          </Tooltip>
        {/snippet}
      </Menu>
      <textarea
        bind:this={input}
        data-slot="prompt-bar-input" class={r.input()}
        rows="1"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={openKind ? "true" : "false"}
        aria-controls={openKind ? `${id}-${openKind}s` : undefined}
        aria-activedescendant={activeId}
        aria-label={ariaLabel}
        placeholder={dictating ? "Listening…" : placeholder}
        enterkeyhint="send"
        oninput={onInput}
        onkeydown={onKeyDown}
        onkeyup={onKeyUp}
        onclick={syncCaret}
        onblur={() => { if (openKind) dismissed = true; }}
        onfocus={() => { if (dismissed) { dismissed = false; syncCaret(); } }}
      ></textarea>
      <Select data-prompt-bar="model"
        class={r.model()}
        items={models}
        value={currentModel}
        onvaluechange={onModel}
        size="sm"
        variant="ghost"
        placement="top-start"
        aria-label="Choose model"
      />
      <Tooltip content={dictateLabel}>
        {#snippet trigger(props)}
          <button
            {...mergeProps(props(), { onclick: onDictate })}
            type="button"
            data-slot="button"
            class={dictateButton.base({ class: r.dictate() })}
            data-prompt-bar="dictate"
            aria-pressed={dictating ? "true" : "false"}
            aria-label={dictateLabel}
          >
            <span data-slot="button-icon" class={dictateButton.icon()} aria-hidden="true"><Microphone data-slot="icon" weight="bold" /></span>
            <span data-slot="prompt-bar-bars" class={r.bars()} aria-hidden="true"><span data-slot="prompt-bar-bar" class={r.bar()}></span><span data-slot="prompt-bar-bar" class={r.bar()}></span><span data-slot="prompt-bar-bar" class={r.bar()}></span></span>
          </button>
        {/snippet}
      </Tooltip>
      <Tooltip content={sendLabel}>
        {#snippet trigger(props)}
          <Button {...mergeProps(props(), { onclick: submit })} data-prompt-bar="send" class={r.send()} variant="primary" size="sm" shape={btnShape} square iconSize={busy ? 12 : undefined} aria-label={sendLabel} disabled={!busy && !canSend}>
            {#snippet icon()}{#if busy}<Stop data-slot="icon" weight="fill" />{:else}<ArrowUp data-slot="icon" weight="bold" />{/if}{/snippet}
          </Button>
        {/snippet}
      </Tooltip>
    </div>
  </div>
  {#each lists as l (l.kind)}
    <Portal>
      <div bind:this={positioners[l.kind]} data-slot="prompt-bar-positioner" class={r.positioner()} data-scope="prompt-bar" data-part="positioner">
        <div data-slot="prompt-bar-list" class={r.list()} data-kind={l.kind} data-state={l.open ? "open" : "closed"} hidden={!l.open}>
          <!-- svelte-ignore a11y_interactive_supports_focus (the textarea owns focus and points here through aria-activedescendant) -->
          <div
            bind:this={listboxes[l.kind]}
            id={`${id}-${l.kind}s`}
            data-slot="prompt-bar-options" class={r.options()}
            role="listbox"
            aria-label={l.label}
            onmousedown={(e) => e.preventDefault()}
          >
            <span bind:this={highlights[l.kind]} data-slot="prompt-bar-highlight" class={r.highlight()} aria-hidden="true"></span>
            {#each l.rows as o (o.option.value)}
              <!-- keys are handled on the textarea (aria-activedescendant); options never take focus -->
              <!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus -->
              <div
                id={optionId(l.kind, o.i)}
                data-slot="prompt-bar-option" class={r.option()}
                role="option"
                aria-selected={o.on ? "true" : "false"}
                data-value={o.option.value}
                data-highlighted={o.on ? "" : undefined}
                hidden={!o.isShown}
                onpointermove={() => { if (openKind === l.kind && o.isShown && o.position !== activeIndex) active = o.position; }}
                onclick={() => { if (openKind === l.kind) accept(o.position); }}
              >
                {#if l.kind === "source"}{@const Icon = glyph(o.option.icon)}<span data-slot="prompt-bar-option-icon" class={r.optionIcon()} aria-hidden="true"><Icon data-slot="icon" weight="bold" /></span>{/if}
                <span data-slot="prompt-bar-option-label" class={r.optionLabel()}>{shownLabel(l.kind, o.option, o.i)}</span>
                {#if o.option.description}<span data-slot="prompt-bar-option-description" class={r.optionDescription()}>{o.option.description}</span>{/if}
              </div>
            {/each}
          </div>
          <EmptyState data-prompt-bar="empty" title="No matches" hidden={!l.open || visible.length > 0} />
          <div data-slot="prompt-bar-footer" class={r.footer()}>{l.footer}</div>
        </div>
      </div>
    </Portal>
  {/each}
</div>
