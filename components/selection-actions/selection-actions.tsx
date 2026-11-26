"use client";
import { Popover as ArkPopover, usePopover } from "@ark-ui/react/popover";
import { Portal } from "@ark-ui/react/portal";
import {
  ArrowClockwise, ChatText, Check, CornersIn, ListBullets, MagicWand, PencilSimple, Question, Sparkle, TextAa, X,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "../button/button";
import { Shimmer } from "../shimmer/shimmer";
import { Spinner } from "../spinner/spinner";
import { selectionActions } from "./selection-actions.recipe";
import { streamingText } from "../streaming-text/streaming-text.recipe";
import { trackModality } from "../lib/modality";
import {
  anchorRect, clearNativeSelection, modeOf, restoreSelection, rovingToolbar, spliceResult, splitText, watchSelection,
  type SelectionAction, type TextRange,
} from "./selection-actions.logic";

export type { SelectionAction, SelectionActionIcon, TextRange } from "./selection-actions.logic";

export type SelectionActionsProps = {
  /** The passage. Keep writes the result into it. */
  text?: string;
  defaultText?: string;
  onTextChange?: (text: string) => void;
  /** { start, end } offsets into text, or null. Set by selecting in the passage. */
  selection?: TextRange | null;
  defaultSelection?: TextRange | null;
  onSelectionChange?: (selection: TextRange | null) => void;
  /** The toolbar is showing. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The action's output, shown in place of the selection; feed it as it streams. */
  result?: string;
  defaultResult?: string;
  onResultChange?: (result: string) => void;
  /** The action is running. */
  busy?: boolean;
  /** Actions offered while idle. */
  actions?: SelectionAction[];
  /** Overrides the status label while busy (an ellipsis is added). */
  busyLabel?: string;
  /** Name of the toolbar. */
  "aria-label"?: string;
  /** An action or Try again, with the selected original text. */
  onAction?: (detail: { value: string; text: string }) => void;
  onKeep?: (detail: { text: string; result: string }) => void;
  onDiscard?: () => void;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

const ICONS = {
  question: Question, sparkle: Sparkle, "corners-in": CornersIn, "chat-text": ChatText, "text-aa": TextAa,
  "magic-wand": MagicWand, "pencil-simple": PencilSimple, "list-bullets": ListBullets,
} as const;

function useControllable<T>(value: T | undefined, initial: T, onChange?: (v: T) => void): [T, (v: T) => void] {
  const [local, setLocal] = useState(initial);
  const current = value !== undefined ? value : local;
  return [current, (next: T) => { if (value === undefined) setLocal(next); onChange?.(next); }];
}

/** A floating AI toolbar for selected text. Behaviour by Ark UI (Zag popover). */
export function SelectionActions({
  text: textProp, defaultText = "", onTextChange, selection: selectionProp, defaultSelection = null, onSelectionChange,
  open: openProp, defaultOpen = false, onOpenChange, result: resultProp, defaultResult = "", onResultChange,
  busy = false, actions = [], busyLabel, "aria-label": ariaLabel = "Edit selection", onAction, onKeep, onDiscard, className, style, ...data
}: SelectionActionsProps) {
  const [text, setText] = useControllable(textProp, defaultText, onTextChange);
  const [selection, setSelection] = useControllable<TextRange | null>(selectionProp, defaultSelection, onSelectionChange);
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const [result, setResult] = useControllable(resultProp, defaultResult, onResultChange);
  const [last, setLast] = useState<SelectionAction | null>(null);
  const mode = modeOf(busy, result);
  const parts = splitText(text, selection, result);

  const passage = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const escaped = useRef(false);
  const watcher = useRef<ReturnType<typeof watchSelection> | null>(null);

  /** The toolbar closed by itself: Escape, a press outside, focus leaving. */
  const dismiss = () => {
    const wasEscape = escaped.current;
    escaped.current = false;
    const held = selection;
    const working = mode !== "idle";
    if (working) { setResult(""); onDiscard?.(); }
    setOpen(false);
    /* pressing in the passage starts a new selection: keep the mark until the press ends */
    if (!wasEscape && !working && watcher.current?.pressedInside()) return;
    setSelection(null);
    if (wasEscape) restoreSelection(passage.current, held);
  };
  const onSelect = (sel: TextRange | null) => {
    if (mode !== "idle") return;
    if (!sel) { if (!open) setSelection(null); return; }
    clearNativeSelection();
    setSelection(sel);
    setOpen(true);
  };
  /* DOM listeners outlive renders: route them to this render's handlers */
  const live = useRef({ dismiss, onSelect });
  live.current = { dismiss, onSelect };

  const popover = usePopover({
    open,
    autoFocus: true,
    restoreFocus: false,
    /* we portal it ourselves; false keeps Zag from redirecting Tab to a trigger there is none of */
    portalled: false,
    positioning: { placement: "bottom", gutter: 8, getAnchorRect: () => anchorRect(passage.current) },
    onEscapeKeyDown: () => { escaped.current = true; },
    onOpenChange: (details) => { if (!details.open) live.current.dismiss(); },
  });

  useEffect(() => {
    trackModality();
    if (!passage.current || !content.current) return;
    const w = watchSelection(passage.current, (sel) => live.current.onSelect(sel));
    watcher.current = w;
    const stop = rovingToolbar(content.current, () => passage.current, () => { escaped.current = true; });
    return () => { w.stop(); stop(); watcher.current = null; };
  }, []);
  /* the mark grows as the result streams: keep the toolbar under it */
  useEffect(() => { if (open) popover.reposition(); }, [open, result, mode, selection?.start, selection?.end]);

  const original = selection ? text.slice(selection.start, selection.end) : "";
  const run = (action: SelectionAction) => { setLast(action); onAction?.({ value: action.value, text: original }); };
  const retry = () => {
    const value = last?.value ?? actions.find((a) => a.busyLabel)?.value ?? actions[0]?.value ?? "";
    setResult("");
    onAction?.({ value, text: original });
  };
  const keep = () => {
    if (!selection) return;
    const next = spliceResult(text, selection, result);
    const kept = result;
    setText(next.text);
    setResult("");
    onKeep?.({ text: next.text, result: kept });
    setOpen(false);
    setSelection(null);
    restoreSelection(passage.current, next.selection);
  };
  const discard = () => {
    const held = selection;
    setResult("");
    onDiscard?.();
    setOpen(false);
    setSelection(null);
    restoreSelection(passage.current, held);
  };
  const label = `${busyLabel ?? last?.busyLabel ?? "Editing"}…`;
  const r = selectionActions();

  return (
    <ArkPopover.RootProvider value={popover}>
      <div {...data} data-slot="selection-actions" className={r.base({ class: className })} style={style}>
        <ArkPopover.Anchor ref={passage} data-slot="selection-actions-text" className={r.text()} tabIndex={-1}>
          {parts ? (
            <>
              {parts.before}
              <mark data-slot="selection-actions-mark" className={r.mark({ open })}>
                {parts.inner}
                {mode === "busy" && result && <span data-slot="streaming-text-caret" className={streamingText().caret()} aria-hidden />}
              </mark>
              {parts.after}
            </>
          ) : text}
        </ArkPopover.Anchor>
      </div>
      <Portal>
        <ArkPopover.Positioner data-slot="selection-actions-positioner" className={r.positioner()}>
          <ArkPopover.Content ref={content} data-slot="selection-actions-content" className={r.content()} role="toolbar" aria-label={ariaLabel}>
            {mode === "idle" && actions.map((a) => {
              const Glyph = ICONS[a.icon ?? "sparkle"];
              return (
                <Button key={a.value} data-selection-actions="action" className={r.action()} variant="ghost" size="sm" data-value={a.value} onClick={() => run(a)}
                  icon={<Glyph data-slot="icon" weight={a.icon === "sparkle" || !a.icon ? "fill" : "bold"} />}>
                  {a.label}
                </Button>
              );
            })}
            {mode === "busy" && (
              <span data-slot="selection-actions-status" className={r.status()} role="status">
                <Spinner size="sm" decorative />
                {result ? <span data-slot="selection-actions-label" className={r.label()}>{label}</span> : <Shimmer speed="fast">{label}</Shimmer>}
              </span>
            )}
            {mode === "result" && (
              <>
                <Button data-selection-actions="keep" className={r.keep()} variant="primary" size="sm" onClick={keep} icon={<Check data-slot="icon" weight="bold" />}>Keep</Button>
                <Button data-selection-actions="discard" className={r.discard()} variant="ghost" size="sm" onClick={discard} icon={<X data-slot="icon" weight="bold" />}>Discard</Button>
                <span data-slot="selection-actions-separator" className={r.separator()} aria-hidden />
                <Button data-selection-actions="retry" className={r.retry()} variant="ghost" size="sm" square aria-label="Try again" onClick={retry} icon={<ArrowClockwise data-slot="icon" weight="bold" />} />
              </>
            )}
          </ArkPopover.Content>
        </ArkPopover.Positioner>
      </Portal>
    </ArkPopover.RootProvider>
  );
}
