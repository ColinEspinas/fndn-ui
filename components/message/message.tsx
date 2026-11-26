"use client";
import { ArrowClockwise, Check, Copy, PencilSimple, ThumbsDown, ThumbsUp } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { Avatar } from "../avatar/avatar";
import { Button } from "../button/button";
import { Chip } from "../chip/chip";
import { message } from "./message.recipe";
import { Shimmer } from "../shimmer/shimmer";
import { Toggle } from "../toggle/toggle";
import { Tooltip } from "../tooltip/tooltip";
import { createCopier, messageLabels, orderActions, type MessageAction, type MessageFeedback, type MessageLabels } from "./message.logic";
import { trackModality } from "../lib/modality";

export type { MessageAction, MessageFeedback, MessageLabels } from "./message.logic";

export type MessageProps = Omit<HTMLAttributes<HTMLElement>, "children" | "role"> & {
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
  children?: ReactNode;
  /** Still being written: aria-busy, no actions, and a "Thinking…" status while there is nothing yet. */
  streaming?: boolean;
  /** The actions offered under it, shown on hover and focus (always on touch). */
  actions?: MessageAction[];
  /** What Copy puts on the clipboard; defaults to text. */
  copyText?: string;
  /** Good / Bad response. Omit for uncontrolled (defaultFeedback). */
  feedback?: MessageFeedback;
  defaultFeedback?: MessageFeedback;
  onFeedbackChange?: (feedback: MessageFeedback) => void;
  /** An action was pressed (Copy after it copied). */
  onAction?: (action: MessageAction) => void;
  labels?: Partial<MessageLabels>;
};

/** One message of a conversation. */
export function Message({
  role = "assistant", name, avatar, source, time, datetime, text, children, streaming = false, actions, copyText,
  feedback: feedbackProp, defaultFeedback = null, onFeedbackChange, onAction, labels, className, ...rest
}: MessageProps) {
  const t = messageLabels(labels);
  const [localFeedback, setLocalFeedback] = useState<MessageFeedback>(defaultFeedback);
  const feedback = feedbackProp !== undefined ? feedbackProp : localFeedback;
  const setFeedback = (next: MessageFeedback) => { if (feedbackProp === undefined) setLocalFeedback(next); onFeedbackChange?.(next); };
  const [copied, setCopied] = useState(false);
  const copier = useRef<ReturnType<typeof createCopier>>(null);
  useEffect(() => { trackModality(); const c = createCopier(setCopied); copier.current = c; return () => c.stop(); }, []);
  const copy = async () => { if (await copier.current?.copy(copyText ?? text ?? "")) onAction?.("copy"); };

  const r = message({ role, kept: feedback != null });
  const hasContent = (text != null && text !== "") || (children != null && children !== false);
  const shown = streaming ? [] : orderActions(actions);
  const plain = (action: Exclude<MessageAction, "copy" | "good" | "bad">, icon: ReactNode) => (
    <Tooltip key={action} content={t[action]}>
      <Button variant="ghost" size="xs" shape="rounded" square muted aria-label={t[action]} onClick={() => onAction?.(action)} icon={icon} />
    </Tooltip>
  );

  return (
    <article data-slot="message" className={r.base({ class: className })} aria-busy={streaming || undefined} {...rest}>
      {avatar && <Avatar data-message="avatar" className={r.avatar()} size={20} name={name} src={typeof avatar === "string" ? avatar : undefined} />}
      <div data-slot="message-main" className={r.main()}>
        {(name || source || time) && (
          <div data-slot="message-header" className={r.header()}>
            {name && <span data-slot="message-name" className={r.name()} title={name}>{name}</span>}
            {source && <Chip data-message="source" className={r.source()} title={source}>{source}</Chip>}
            {time && <time data-slot="message-time" className={r.time()} dateTime={datetime}>{time}</time>}
          </div>
        )}
        <div data-slot="message-body" className={r.body()}>
          {text != null && text !== "" ? <p data-slot="message-text" className={r.text()}>{text}</p> : children}
          {streaming && !hasContent && <div data-slot="message-status" className={r.status()} role="status"><Shimmer speed="fast">{`${t.thinking}…`}</Shimmer></div>}
        </div>
        {shown.length > 0 && (
          <div data-slot="message-actions" className={r.actions()} role="group" aria-label={t.actions}>
            {shown.map((action) => {
              if (action === "copy") return (
                <Tooltip key="copy" content={copied ? t.copied : t.copy}>
                  <Button
                    variant="ghost" size="xs" shape="rounded" square muted swapped={copied} aria-label={t.copy} onClick={copy}
                    icon={<><Copy data-slot="icon" weight="bold" /><Check data-slot="icon" weight="bold" /></>}
                  />
                </Tooltip>
              );
              if (action === "retry") return plain("retry", <ArrowClockwise data-slot="icon" weight="bold" />);
              if (action === "edit") return plain("edit", <PencilSimple data-slot="icon" weight="bold" />);
              const good = action === "good";
              return (
                <Toggle
                  key={action} variant="ghost" size="xs" shape="rounded" square muted tooltip={good ? t.good : t.bad}
                  pressed={feedback === action}
                  onPressedChange={(on) => { setFeedback(on ? action : null); onAction?.(action); }}
                  icon={good ? <ThumbsUp data-slot="icon" weight={feedback === "good" ? "fill" : "bold"} /> : <ThumbsDown data-slot="icon" weight={feedback === "bad" ? "fill" : "bold"} />}
                />
              );
            })}
            {shown.includes("copy") && <span data-slot="message-announce" className="sr-only" role="status">{copied ? t.copied : ""}</span>}
          </div>
        )}
      </div>
    </article>
  );
}
