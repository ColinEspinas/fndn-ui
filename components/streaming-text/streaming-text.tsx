"use client";
import type { Icon } from "@phosphor-icons/react";
import { Fragment, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from "react";
import { ArrowCounterClockwise, ArrowElbowDownLeft, Copy, ThumbsDown, ThumbsUp } from "@phosphor-icons/react";
import { Avatar } from "../avatar/avatar";
import { Button } from "../button/button";
import { streamingText } from "./streaming-text.recipe";
import { Collapsible } from "../collapsible/collapsible";
import { Tooltip } from "../tooltip/tooltip";
import { initialsOf, maxInitials } from "../avatar/avatar.logic";
import { stallTimer } from "./streaming-text.logic";

/** One streamed word, or a cite placeholder that renders an inline source chip (index into sources, or true for the first). */
export type StreamingToken = { text: string; cite?: boolean | number };
export type StreamingSource = { name: string; domain: string; href: string; image: string };
export type StreamingAction = "copy" | "retry" | "up" | "down";

export type StreamingTextProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "content"> & {
  /** The tokens streamed so far. The host appends to it and flips `done`. */
  content: StreamingToken[];
  sources?: StreamingSource[];
  followUps?: string[];
  done?: boolean;
  sourcesOpen?: boolean;
  defaultSourcesOpen?: boolean;
  onSourcesOpenChange?: (open: boolean) => void;
  /** Fill the parent width (and drop the reserved height). */
  fill?: boolean;
  sourcesLabel?: string;
  followUpsLabel?: string;
  /** Announced once done. */
  statusLabel?: string;
  onFollowUp?: (text: string, index: number) => void;
  onAction?: (action: StreamingAction) => void;
  /** Enter on mount: the caret fades in, cites already streamed pop in, follow-ups of an answer mounted done rise. Off by default; set it on the answer your code adds live, never on one rendered from history or with the page. Cites streamed later and follow-ups that come with done enter either way. */
  appear?: boolean;
};

const ACTIONS: { key: StreamingAction; label: string; icon: Icon }[] = [
  { key: "copy", label: "Copy", icon: Copy },
  { key: "retry", label: "Retry", icon: ArrowCounterClockwise },
  { key: "up", label: "Good answer", icon: ThumbsUp },
  { key: "down", label: "Bad answer", icon: ThumbsDown },
];

/** Streamed answer with inline sources, actions and follow-ups. */
export function StreamingText({
  content, sources = [], followUps = [], done = false, sourcesOpen, defaultSourcesOpen = false, onSourcesOpenChange,
  fill, sourcesLabel = "Sources", followUpsLabel = "Follow-ups", statusLabel = "Answer complete", onFollowUp, onAction, appear = false, className, ...rest
}: StreamingTextProps) {
  const [inner, setInner] = useState(defaultSourcesOpen);
  /* the list opens only once the answer is done */
  const open = done && (sourcesOpen ?? inner);
  /* a stream with no new word for a while: the caret blinks until the next one */
  const [stalled, setStalled] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const last = content[content.length - 1];
  const progress = `${content.length}:${last?.text?.length ?? 0}`;
  useEffect(() => {
    setStalled(false);
    if (done) return;
    return stallTimer(rootRef.current, () => setStalled(true));
  }, [progress, done]);
  const r = streamingText({ done: !!done, fill: !!fill, stalled: stalled && !done });
  /* without appear, what is here at mount is simply there; what streams in later enters */
  const atMount = useRef({ appear, tokens: content.length, done: !!done }).current;
  const toggle = (n: boolean) => { if (sourcesOpen === undefined) setInner(n); onSourcesOpenChange?.(n); };
  /* a source's image, or its initials while it loads or if it fails; decorative next to its name */
  const avatarOf = (s: StreamingSource, size: 12 | 14 | 16) => (
    { src: s.image, initials: initialsOf(s.name, maxInitials(size)), size, shape: size === 14 ? ("round" as const) : ("square" as const) }
  );

  return (
    <div ref={rootRef} data-slot="streaming-text" className={r.base({ class: className })} aria-busy={done ? undefined : true} {...rest}>
      <span data-slot="streaming-text-status" className={r.status()} role="status">{done ? statusLabel : ""}</span>
      <p data-slot="streaming-text-text" className={r.text()}>
        {content.map((token, i) => {
          if (token.cite !== undefined && token.cite !== false) {
            const source = sources[token.cite === true ? 0 : token.cite];
            if (!source) return null;
            return (
              <a key={i} data-slot="streaming-text-cite" className={r.cite({ appear: atMount.appear || i >= atMount.tokens })} href={source.href} target="_blank" rel="noreferrer">
                <Avatar data-streaming-text="cite-avatar" className={r.citeAvatar()} {...avatarOf(source, 12)} />
                <span>{source.domain}</span>
              </a>
            );
          }
          return <span key={i}>{token.text} </span>;
        })}
        <span data-slot="streaming-text-caret" className={r.caret({ appear: atMount.appear, stalled: stalled && !done })} aria-hidden />
      </p>

      <div data-slot="streaming-text-actions" className={r.actions()}>
        {ACTIONS.map(({ key, label, icon: ActionIcon }) => (
          <Tooltip key={key} content={label}>
            <Button
              className={r.action()}
              data-streaming-text="action"
              variant="ghost"
              size="xs"
              shape="rounded"
              square
              muted
              aria-label={label}
              data-action={key}
              onClick={() => onAction?.(key)}
              icon={<ActionIcon data-slot="icon" weight="bold" />}
            />
          </Tooltip>
        ))}
        {sources.length > 0 && (
          <Collapsible
            className={r.sources()}
            data-streaming-text="sources"
            variant="inline"
            caret="none"
            open={open}
            onOpenChange={toggle}
            label={
              <>
                <span data-slot="streaming-text-avatars" className={r.avatars()} aria-hidden>
                  {sources.slice(0, 3).map((s, i) => <Fragment key={i}><Avatar data-streaming-text="avatar" className={r.avatar()} {...avatarOf(s, 14)} /></Fragment>)}
                </span>
                <span data-slot="streaming-text-sources-label" className={r.sourcesLabel()}>{sourcesLabel}</span>
              </>
            }
          >
            <div data-slot="streaming-text-sources-list" className={r.sourcesList()}>
              {sources.map((s, i) => (
                <a key={i} data-slot="streaming-text-source" className={r.source()} href={s.href} target="_blank" rel="noreferrer">
                  <Avatar data-streaming-text="source-avatar" className={r.sourceAvatar()} {...avatarOf(s, 16)} />
                  <span data-slot="streaming-text-source-name" className={r.sourceName()} title={s.name}>{s.name}</span>
                  <span data-slot="streaming-text-source-domain" className={r.sourceDomain()} title={s.domain}>{s.domain}</span>
                </a>
              ))}
            </div>
          </Collapsible>
        )}
      </div>

      {followUps.length > 0 && (
        <div data-slot="streaming-text-followups" className={r.followups()}>
          <p data-slot="streaming-text-followups-title" className={r.followupsTitle({ appear: atMount.appear || !atMount.done })}>{followUpsLabel}</p>
          <div data-slot="streaming-text-followups-list" className={r.followupsList()}>
            {followUps.map((text, i) => (
              <button key={i} type="button" data-slot="streaming-text-followup" className={r.followup({ appear: atMount.appear || !atMount.done })} style={{ "--fndn-row-index": i } as CSSProperties} onClick={() => onFollowUp?.(text, i)}>
                <ArrowElbowDownLeft data-slot="icon" weight="bold" aria-hidden />
                <span data-slot="streaming-text-followup-text" className={r.followupText()}>{text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
