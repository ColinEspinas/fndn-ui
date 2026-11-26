"use client";
import { ArrowsOutSimple, Cursor } from "@phosphor-icons/react";
import { useState, type CSSProperties } from "react";
import { Button } from "../button/button";
import { Dialog } from "../dialog/dialog";
import { Spinner } from "../spinner/spinner";
import { agentScreen } from "./agent-screen.recipe";
import { Tooltip } from "../tooltip/tooltip";
import {
  agentScreenLabels, agentScreenStatus, cursorValue,
  type AgentScreenCursor, type AgentScreenLabels, type AgentScreenState,
} from "./agent-screen.logic";

export type { AgentScreenCursor, AgentScreenLabels, AgentScreenState };

export type AgentScreenProps = {
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
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/** A framed capture of the agent's screen with its cursor and a recording badge. */
export function AgentScreen({
  state = "live", cursor, recording = false, label = "Agent's screen", alt, src, labels, expandable = false, className, style, ...data
}: AgentScreenProps) {
  const text = agentScreenLabels(labels);
  const [open, setOpen] = useState(false);
  const r = agentScreen({ state, recording, placeholder: !src });
  const frame = (inViewer: boolean) => (
    <div data-slot="agent-screen-frame" className={r.frame({ inViewer })} role="img" aria-label={alt ?? label}>
      {src ? (
        <img data-slot="agent-screen-media" className={r.media()} src={src} alt="" />
      ) : (
        <span data-slot="agent-screen-placeholder" className={r.placeholder()} aria-hidden>
          <span data-slot="agent-screen-chrome" className={r.chrome()} />
          <span data-slot="agent-screen-page" className={r.page()}>
            {[0, 1, 2, 3].map((i) => <span key={i} data-slot="agent-screen-line" className={r.line()} />)}
          </span>
        </span>
      )}
      <span data-slot="agent-screen-cursor" className={r.cursor()} aria-hidden style={{ "--fndn-agent-screen-cursor": cursorValue(cursor) } as CSSProperties}>
        <Cursor data-slot="icon" weight="fill" />
      </span>
      <span data-slot="agent-screen-loading" className={r.loading()} aria-hidden>
        <Spinner size="md" decorative />
        <span data-slot="agent-screen-loading-text" className={r.loadingText()}>{text.loading}</span>
      </span>
      <span data-slot="agent-screen-rec" className={r.rec()} aria-hidden><span data-slot="agent-screen-rec-dot" className={r.recDot()} />{text.rec}</span>
    </div>
  );
  return (
    <figure {...data} data-slot="agent-screen" className={r.base({ class: className })} style={style}>
      <span data-slot="agent-screen-status" className={r.status()} role="status">{agentScreenStatus(label, state, recording, text)}</span>
      {frame(false)}
      {expandable && (
        <>
          <Tooltip content={text.expand}>
            <Button
              data-agent-screen="expand"
              className={r.expand()}
              variant="outline"
              size="xs"
              shape="rounded"
              square
              aria-label={text.expand}
              aria-haspopup="dialog"
              icon={<ArrowsOutSimple data-slot="icon" weight="bold" />}
              onClick={() => setOpen(true)}
            />
          </Tooltip>
          <Dialog open={open} onOpenChange={setOpen} title={label} size="lg">
            <div data-slot="agent-screen-viewer" className={r.viewer()}>{frame(true)}</div>
          </Dialog>
        </>
      )}
      <figcaption data-slot="agent-screen-label" className={r.label()} title={label}>{label}</figcaption>
    </figure>
  );
}
