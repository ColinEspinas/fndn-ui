"use client";
import { ArrowUp, Stop } from "@phosphor-icons/react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Button } from "../button/button";
import { Message } from "../message/message";
import { Shimmer } from "../shimmer/shimmer";
import { chatComposer } from "./chat-composer.recipe";
import { Tabs } from "../tabs/tabs";
import { Tooltip } from "../tooltip/tooltip";
import { chatComposerLabels, pressField, timeText, watchThreads, type ChatComposerLabels } from "./chat-composer.logic";
import { trackModality } from "../lib/modality";
import { autosize } from "../prompt-bar/prompt-bar.logic";
import { isSubmitKey } from "../prompt-bar/prompt-suggest";

export type ChatComposerMessage =
  | { role: "user"; text: string }
  | { role: "agent"; text: string; label?: string; source?: string; time?: string };
export type ChatComposerTab = { value: string; label?: string; messages?: ChatComposerMessage[] };
export type ChatComposerSubmit = { value: string; tab: string | null };
export type { ChatComposerLabels } from "./chat-composer.logic";

export type ChatComposerProps = {
  /** Conversations in order. Sending appends the user's message to the selected tab. */
  tabs?: ChatComposerTab[];
  defaultTabs?: ChatComposerTab[];
  onTabsChange?: (tabs: ChatComposerTab[]) => void;
  /** Selected conversation. Defaults to the first. */
  tab?: string;
  defaultTab?: string;
  onTabChange?: (tab: string) => void;
  /** The draft. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Prompts offered as pills; choosing one puts it in the composer. */
  suggestions?: string[];
  /** The agent is working: status instead of suggestions, send becomes stop. */
  busy?: boolean;
  /** Busy label (an ellipsis is added). */
  status?: string;
  placeholder?: string;
  /** Name of the tab list. */
  "aria-label"?: string;
  /** Enter or the send button, with the trimmed draft; the composer then clears. */
  onSubmit?: (detail: ChatComposerSubmit) => void;
  onStop?: () => void;
  /** The fixed strings: { message, send, stop, time } ({time} is a step's duration). */
  labels?: Partial<ChatComposerLabels>;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

function useControllable<T>(value: T | undefined, initial: T, onChange?: (v: T) => void): [T, (v: T) => void] {
  const [local, setLocal] = useState(initial);
  const current = value !== undefined ? value : local;
  return [current, (next: T) => { if (value === undefined) setLocal(next); onChange?.(next); }];
}

const r = chatComposer();

/* each message is the real Message: the person's bubble, or an agent step (label, source, time) */
function ThreadMessage({ m, t }: { m: ChatComposerMessage; t: ChatComposerLabels }) {
  if (m.role === "user") return <Message data-chat-composer="message" className={r.message()} role="user" text={m.text} />;
  return <Message data-chat-composer="message" className={r.message()} role="assistant" name={m.label} source={m.source} time={m.time ? timeText(m.time, t) : undefined} text={m.text} />;
}

/** A compact chat panel: tab strip, threads, composer. */
export function ChatComposer({
  tabs: tabsProp, defaultTabs = [], onTabsChange, tab: tabProp, defaultTab, onTabChange, value: valueProp, defaultValue = "", onValueChange,
  suggestions = [], busy = false, status = "Thinking", placeholder = "Write a message…", "aria-label": ariaLabel = "Conversations",
  onSubmit, onStop, labels, className, style, ...data
}: ChatComposerProps) {
  const t = chatComposerLabels(labels);
  const [tabs, setTabs] = useControllable(tabsProp, defaultTabs, onTabsChange);
  const [tab, setTab] = useControllable<string | undefined>(tabProp, defaultTab ?? tabs[0]?.value, onTabChange as (v: string | undefined) => void);
  const [value, setValue] = useControllable(valueProp, defaultValue, onValueChange);

  const root = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const sizing = useRef<ReturnType<typeof autosize> | null>(null);
  useEffect(() => {
    trackModality();
    if (!root.current || !field.current || !input.current) return;
    sizing.current = autosize(input.current);
    const stops = [watchThreads(root.current), pressField(field.current, input.current)];
    return () => { stops.forEach((s) => s()); sizing.current?.stop(); sizing.current = null; };
  }, []);
  /* the textarea is written through the DOM (no value prop), so every target renders it alike */
  useLayoutEffect(() => {
    const el = input.current;
    if (el && el.value !== value) el.value = value;
    sizing.current?.update();
  }, [value]);

  const current = tab ?? null;
  const submit = () => {
    if (busy) { onStop?.(); return; }
    const text = value.trim();
    if (!text) return;
    setTabs(tabs.map((t) => (t.value === current ? { ...t, messages: [...(t.messages ?? []), { role: "user", text }] } : t)));
    onSubmit?.({ value: text, tab: current });
    setValue("");
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isSubmitKey(e.nativeEvent)) return;
    e.preventDefault();
    if (!busy) submit();
  };
  const suggest = (text: string) => {
    setValue(text);
    const el = input.current;
    if (el) { el.focus(); requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length)); }
  };

  return (
    <div ref={root} {...data} data-slot="chat-composer" className={r.base({ class: className })} style={style}>
      <Tabs data-chat-composer="tabs"
        className={r.tabs()}
        aria-label={ariaLabel}
        value={tab}
        onValueChange={(next) => setTab(next)}
        items={tabs.map((conversation) => ({
          value: conversation.value,
          label: conversation.label ?? conversation.value,
          content: (
            <div data-slot="chat-composer-thread" className={r.thread()} role="log">
              {(conversation.messages ?? []).map((m, i) => <ThreadMessage key={i} m={m} t={t} />)}
            </div>
          ),
        }))}
      />
      <div data-slot="chat-composer-composer" className={r.composer()}>
        {busy ? (
          <div data-slot="chat-composer-status" className={r.status()} role="status"><Shimmer speed="fast">{`${status}…`}</Shimmer></div>
        ) : suggestions.length > 0 && (
          <div data-slot="chat-composer-suggestions" className={r.suggestions()}>
            {suggestions.map((s, i) => (
              <Button data-chat-composer="suggestion" key={i} className={r.suggestion()} variant="outline" size="sm" title={s} onClick={() => suggest(s)}>{s}</Button>
            ))}
          </div>
        )}
        <div ref={field} data-slot="chat-composer-field" className={r.field()}>
          <textarea
            ref={input}
            data-slot="chat-composer-input"
            className={r.input()}
            rows={1}
            aria-label={t.message}
            placeholder={placeholder}
            enterKeyHint="send"
            onInput={(e) => setValue(e.currentTarget.value)}
            onKeyDown={onKeyDown}
          />
          <div data-slot="chat-composer-footer" className={r.footer()}>
            <Tooltip content={busy ? t.stop : t.send}>
              <Button
                data-chat-composer="send"
                className={r.send()}
                variant="primary"
                size="sm"
                square
                aria-label={busy ? t.stop : t.send}
                disabled={!busy && !value.trim()}
                onClick={submit}
                icon={busy ? <Stop data-slot="icon" weight="fill" /> : <ArrowUp data-slot="icon" weight="bold" />}
              />
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
