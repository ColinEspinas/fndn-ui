"use client";
import { Portal } from "@ark-ui/react/portal";
import {
  ArrowUp, At, ChartBar, ChatCircle, Database, EnvelopeSimple, File as FileGlyph, FileText, Folder, Globe, Link, Microphone,
  Paperclip, Plus, Stack, Stop, Users,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "../button/button";
import { button } from "../button/button.recipe";
import { Menu, type MenuEntry } from "../menu/menu";
import { Select } from "../select/select";
import { EmptyState } from "../empty-state/empty-state";
import { Tooltip } from "../tooltip/tooltip";
import { Tag } from "../tag/tag";
import { promptBar } from "./prompt-bar.recipe";
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

export type PromptBarProps = {
  /** Radius only. rounded: card radius. pill: fully round while it is one line. */
  shape?: "pill" | "rounded";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  model?: string | null;
  defaultModel?: string | null;
  onModelChange?: (model: string) => void;
  models?: ReadonlyArray<PromptBarModel>;
  /** Typing @ lists them; also listed in the attach menu. */
  sources?: ReadonlyArray<PromptBarSource>;
  /** Typing / lists them. */
  commands?: ReadonlyArray<PromptBarCommand>;
  attachments?: ReadonlyArray<PromptBarAttachment>;
  defaultAttachments?: ReadonlyArray<PromptBarAttachment>;
  onAttachmentsChange?: (attachments: PromptBarAttachment[]) => void;
  dictating?: boolean;
  defaultDictating?: boolean;
  onDictatingChange?: (dictating: boolean) => void;
  /** The agent is working: send becomes stop, Enter does not send. */
  busy?: boolean;
  onSubmit?: (detail: PromptBarSubmit) => void;
  onStop?: () => void;
  /** "Add photos & files" was chosen in the attach menu. */
  onAttach?: () => void;
  "aria-label"?: string;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

const GLYPHS: Record<PromptBarSourceIcon, ReactNode> = {
  database: <Database data-slot="icon" weight="bold" />,
  "chart-bar": <ChartBar data-slot="icon" weight="bold" />,
  stack: <Stack data-slot="icon" weight="bold" />,
  globe: <Globe data-slot="icon" weight="bold" />,
  "file-text": <FileText data-slot="icon" weight="bold" />,
  folder: <Folder data-slot="icon" weight="bold" />,
  link: <Link data-slot="icon" weight="bold" />,
  users: <Users data-slot="icon" weight="bold" />,
  "envelope-simple": <EnvelopeSimple data-slot="icon" weight="bold" />,
  "chat-circle": <ChatCircle data-slot="icon" weight="bold" />,
  at: <At data-slot="icon" weight="bold" />,
};
const glyph = (icon: PromptBarSourceIcon | undefined) => GLYPHS[icon ?? "at"] ?? GLYPHS.at;
const nameOf = (a: PromptBarAttachment) => (typeof a === "string" ? a : a.name);

function useControllable<T>(value: T | undefined, initial: T, onChange?: (v: T) => void): [T, (v: T) => void] {
  const [own, setOwn] = useState<T>(initial);
  const controlled = value !== undefined;
  const current = controlled ? value : own;
  const set = useCallback((next: T) => { if (!controlled) setOwn(next); onChange?.(next); }, [controlled, onChange]);
  return [current, set];
}

/** The composer of an agent surface. */
export function PromptBar({
  shape = "rounded", value: valueProp, defaultValue = "", onValueChange, placeholder = "Write a message…",
  model: modelProp, defaultModel, onModelChange, models = [], sources = [], commands = [],
  attachments: attachmentsProp, defaultAttachments = [], onAttachmentsChange,
  dictating: dictatingProp, defaultDictating = false, onDictatingChange, busy = false, onSubmit, onStop, onAttach,
  "aria-label": ariaLabel = "Prompt", className, style, ...data
}: PromptBarProps) {
  const id = useId();
  const [value, setValue] = useControllable(valueProp, defaultValue, onValueChange);
  const [model, setModel] = useControllable<string | null>(modelProp, defaultModel ?? models[0]?.value ?? null, onModelChange as (m: string | null) => void);
  const [attachments, setAttachments] = useControllable<ReadonlyArray<PromptBarAttachment>>(attachmentsProp, defaultAttachments, onAttachmentsChange as (a: ReadonlyArray<PromptBarAttachment>) => void);
  const [dictating, setDictating] = useControllable(dictatingProp, defaultDictating, onDictatingChange);
  const [caret, setCaret] = useState(value.length);
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const positioners = { source: useRef<HTMLDivElement>(null), command: useRef<HTMLDivElement>(null) };
  const listboxes = { source: useRef<HTMLDivElement>(null), command: useRef<HTMLDivElement>(null) };
  const highlights = { source: useRef<HTMLSpanElement>(null), command: useRef<HTMLSpanElement>(null) };
  const nextCaret = useRef<number | null>(null);

  const sourceOptions = useMemo(() => sources.map((s) => ({ ...s })), [sources]);
  const commandOptions = useMemo(() => commands.map((c) => ({ ...c, label: c.label ?? `/${c.value}` })), [commands]);
  const optionsOf = (kind: SuggestKind) => (kind === "source" ? sourceOptions : commandOptions.map((c) => ({ ...c, label: c.label.replace(/^\//, "") })));

  /* the open list, if any: the token before the caret, unless dismissed */
  const token = dismissed ? null : parseToken(value, caret);
  const openKind: SuggestKind | null = token && (token.kind === "source" ? sources.length : commands.length) ? token.kind : null;
  const visible = openKind && token ? filterOptions(openKind, token.query, optionsOf(openKind)) : [];
  const activeIndex = Math.min(active, Math.max(visible.length - 1, 0));
  const optionId = (kind: SuggestKind, index: number) => `${id}-${kind}-${index}`;
  const allOf = (kind: SuggestKind) => optionsOf(kind);
  const activeId = openKind && visible.length ? optionId(openKind, allOf(openKind).findIndex((o) => o.value === visible[activeIndex]!.value)) : undefined;

  /* the textarea is driven through the DOM, so every target renders the same markup */
  useLayoutEffect(() => {
    const el = input.current;
    if (!el) return;
    if (el.value !== value) el.value = value;
    if (nextCaret.current !== null && document.activeElement === el) el.setSelectionRange(nextCaret.current, nextCaret.current);
    nextCaret.current = null;
  }, [value]);

  useEffect(() => {
    trackModality();
    const stops = (["source", "command"] as const).map((k) =>
      listboxes[k].current && highlights[k].current ? glide(listboxes[k].current!, highlights[k].current!, { rows: "[data-slot=prompt-bar-option]", follow: "highlighted" }) : () => {});
    /* a description cut by its ellipsis (it gives way to the label) carries its full text as a title */
    for (const k of ["source", "command"] as const) stops.push(truncationTitles(listboxes[k].current, "[data-slot=prompt-bar-option-description]"));
    /* an attachment named by a file is cut in the middle, so its extension stays (full name in title) */
    stops.push(middleTruncation(composer.current, "[data-prompt-bar=attachment] > [data-slot=tag-label]", { when: looksLikePath }));
    return () => stops.forEach((s) => s());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sizing = useRef<ReturnType<typeof autosize> | null>(null);
  useEffect(() => {
    if (!input.current) return;
    sizing.current = autosize(input.current);
    return () => sizing.current?.stop();
  }, []);

  const relayout = useCallback(() => setExpanded(wideLayout(row.current, input.current, input.current?.value ?? "")), []);
  useLayoutEffect(() => { relayout(); sizing.current?.update(); }, [value, relayout]);
  /* the layout switch travels: the controls glide to their new row and the composer grows with them */
  useEffect(() => (row.current && composer.current ? flipRow(row.current, composer.current) : undefined), []);
  useEffect(() => {
    if (!row.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(relayout);
    observer.observe(row.current);
    return () => observer.disconnect();
  }, [relayout]);

  useLayoutEffect(() => {
    if (!openKind || !composer.current || !positioners[openKind].current) return;
    return placeList(composer.current, positioners[openKind].current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openKind]);
  useLayoutEffect(() => { if (openKind) revealOption(listboxes[openKind].current, activeId); });

  const change = (next: string, at = next.length) => {
    setCaret(at);
    nextCaret.current = at;
    if (next !== value) setValue(next);
  };
  const accept = (index: number) => {
    const option = visible[index];
    if (!openKind || !token || !option) return;
    const next = applySuggestion(value, token, insertionFor(openKind, option));
    setDismissed(false);
    setActive(0);
    change(next.value, next.caret);
    input.current?.focus();
  };
  const canSend = value.trim().length > 0 || attachments.length > 0;
  const submit = () => {
    if (busy) { onStop?.(); return; }
    if (!canSend) return;
    onSubmit?.({ value, model, attachments: [...attachments] });
    void sweep(canvas.current, !!root.current && getComputedStyle(root.current).direction === "rtl");
    setAttachments([]);
    setDismissed(false);
    change("");
  };
  const syncCaret = () => {
    const at = input.current?.selectionStart ?? value.length;
    if (at !== caret) setCaret(at);
  };

  const menuItems = useMemo<MenuEntry[]>(() => [
    { value: "attach-files", label: "Add photos & files", icon: <Paperclip data-slot="icon" weight="bold" /> },
    ...(sources.length ? [{ type: "separator" } as const] : []),
    ...sources.map((s) => ({ value: `source:${s.value}`, label: s.label, icon: glyph(s.icon) })),
  ], [sources]);
  const onMenuSelect = (picked: string) => {
    if (picked === "attach-files") { onAttach?.(); return; }
    const source = sources.find((s) => `source:${s.value}` === picked);
    if (!source) return;
    const glue = value && !/\s$/.test(value) ? " " : "";
    change(`${value}${glue}${insertionFor("source", source)}`);
    /* the menu hands focus back to its trigger as it closes; take it on to the textarea */
    setTimeout(() => { const el = input.current; if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 0);
  };
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
    /* keep focus in the bar: the chip that takes this one's place, else the textarea */
    requestAnimationFrame(() => focusAfterRemove(root.current, index, input.current));
  };

  const r = promptBar({ shape, expanded });
  const list = (kind: SuggestKind, label: string, footer: string) => {
    const all = allOf(kind);
    const open = openKind === kind;
    const shown = new Set(open ? visible.map((o) => o.value) : all.map((o) => o.value));
    let index = -1;
    return (
      <Portal>
        <div ref={positioners[kind]} data-slot="prompt-bar-positioner" className={r.positioner()} data-scope="prompt-bar" data-part="positioner">
          <div data-slot="prompt-bar-list" className={r.list()} data-kind={kind} data-state={open ? "open" : "closed"} hidden={!open}>
            <div
              ref={listboxes[kind]}
              id={`${id}-${kind}s`}
              data-slot="prompt-bar-options"
              className={r.options()}
              role="listbox"
              aria-label={label}
              onMouseDown={(e) => e.preventDefault()}
            >
              <span ref={highlights[kind]} data-slot="prompt-bar-highlight" className={r.highlight()} aria-hidden />
              {all.map((option, i) => {
                const isShown = shown.has(option.value);
                if (isShown) index++;
                const position = index;
                const on = open && isShown && position === activeIndex;
                const source = kind === "source" ? (option as PromptBarSource) : undefined;
                return (
                  <div
                    key={option.value}
                    id={optionId(kind, i)}
                    data-slot="prompt-bar-option"
                    className={r.option()}
                    role="option"
                    aria-selected={on ? "true" : "false"}
                    data-value={option.value}
                    data-highlighted={on ? "" : undefined}
                    hidden={!isShown}
                    onPointerMove={() => { if (open && isShown && position !== activeIndex) setActive(position); }}
                    onClick={() => open && accept(position)}
                  >
                    {source && <span data-slot="prompt-bar-option-icon" className={r.optionIcon()} aria-hidden>{glyph(source.icon)}</span>}
                    <span data-slot="prompt-bar-option-label" className={r.optionLabel()}>{kind === "source" ? option.label : (commandOptions[i]!.label)}</span>
                    {option.description && <span data-slot="prompt-bar-option-description" className={r.optionDescription()}>{option.description}</span>}
                  </div>
                );
              })}
            </div>
            <EmptyState data-prompt-bar="empty" title="No matches" hidden={!open || visible.length > 0} />
            <div data-slot="prompt-bar-footer" className={r.footer()}>{footer}</div>
          </div>
        </div>
      </Portal>
    );
  };

  /* the buttons follow the bar's shape (radius only) */
  const buttonShape = shape === "rounded" ? "rounded" : "pill";
  const sendLabel = busy ? "Stop generating" : "Send";
  const dictateLabel = dictating ? "Stop dictation" : "Start dictation";
  /* the button recipe on a <button> of our own: the level bars must be its direct flex item */
  const dictateButton = button({ variant: "ghost", size: "sm", shape: buttonShape, square: true, muted: true });

  return (
    <div
      ref={root}
      {...data} data-slot="prompt-bar"
      className={r.base({ class: className })}
      style={style}
    >
      <div ref={composer} data-slot="prompt-bar-composer" className={r.composer()}>
        <canvas ref={canvas} data-slot="prompt-bar-sweep" className={r.sweep()} aria-hidden />
        {attachments.length > 0 && (
          <div data-slot="prompt-bar-attachments" className={r.attachments()} role="list" aria-label="Attachments">
            {attachments.map((a, i) => (
              <Tag key={`${nameOf(a)}-${i}`} data-prompt-bar="attachment" className={r.attachment()} tone="neutral" shape={shape === "pill" ? "pill" : "rounded"} role="listitem"
                icon={<FileGlyph data-slot="icon" weight="bold" />} removable removeLabel={`Remove ${nameOf(a)}`} removeTooltip={`Remove ${nameOf(a)}`}
                removeProps={{ "data-prompt-bar": "attachment-remove" }} onRemove={() => removeAttachment(i)}>
                {nameOf(a)}
              </Tag>
            ))}
          </div>
        )}
        <div ref={row} data-slot="prompt-bar-row" className={r.row()}>
          <Menu data-prompt-bar="attach" className={r.attach()} placement="top-start" items={menuItems} onSelect={onMenuSelect}>
            <Tooltip content="Add attachments and sources">
              <Button data-menu="trigger" data-prompt-bar="attach-trigger" className={r.attachTrigger()} variant="ghost" size="sm" shape={buttonShape} square muted aria-label="Add attachments and sources" icon={<Plus data-slot="icon" weight="bold" />} />
            </Tooltip>
          </Menu>
          <textarea
            ref={input}
            data-slot="prompt-bar-input"
            className={r.input()}
            rows={1}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={openKind ? "true" : "false"}
            aria-controls={openKind ? `${id}-${openKind}s` : undefined}
            aria-activedescendant={activeId}
            aria-label={ariaLabel}
            placeholder={dictating ? "Listening…" : placeholder}
            enterKeyHint="send"
            onInput={(e) => { setDismissed(false); setActive(0); change(e.currentTarget.value, e.currentTarget.selectionStart ?? e.currentTarget.value.length); }}
            onKeyDown={(e) => {
              const action = suggestKey(e.nativeEvent, !!openKind, visible.length, activeIndex);
              if (action) {
                e.preventDefault();
                if (action.type === "move") setActive(action.index);
                else if (action.type === "accept") accept(action.index);
                else setDismissed(true);
                return;
              }
              if (isSubmitKey(e.nativeEvent)) { e.preventDefault(); if (!busy) submit(); }
            }}
            onKeyUp={(e) => { if (!["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"].includes(e.key)) syncCaret(); }}
            onClick={syncCaret}
            onBlur={() => { if (openKind) setDismissed(true); }}
            onFocus={() => { if (dismissed) { setDismissed(false); syncCaret(); } }}
          />
          <Select data-prompt-bar="model"
            className={r.model()}
            items={models}
            value={model}
            onValueChange={(next) => { if (next) setModel(next); }}
            size="sm"
            variant="ghost"
            placement="top-start"
            aria-label="Choose model"
          />
          <Tooltip content={dictateLabel}>
            <button
              type="button"
              data-slot="button"
              className={dictateButton.base({ class: r.dictate() })}
              data-prompt-bar="dictate"
              aria-pressed={dictating ? "true" : "false"}
              aria-label={dictateLabel}
              onClick={() => setDictating(!dictating)}
            >
              <span data-slot="button-icon" className={dictateButton.icon()} aria-hidden><Microphone data-slot="icon" weight="bold" /></span>
              <span data-slot="prompt-bar-bars" className={r.bars()} aria-hidden><span data-slot="prompt-bar-bar" className={r.bar()} /><span data-slot="prompt-bar-bar" className={r.bar()} /><span data-slot="prompt-bar-bar" className={r.bar()} /></span>
            </button>
          </Tooltip>
          <Tooltip content={sendLabel}>
            <Button data-prompt-bar="send" className={r.send()} variant="primary" size="sm" shape={buttonShape} square iconSize={busy ? 12 : undefined} aria-label={sendLabel} disabled={!busy && !canSend} onClick={submit} icon={busy ? <Stop data-slot="icon" weight="fill" /> : <ArrowUp data-slot="icon" weight="bold" />} />
          </Tooltip>
        </div>
      </div>
      {list("source", "Sources", "Type to search sources")}
      {list("command", "Commands", "Type to search commands")}
    </div>
  );
}
