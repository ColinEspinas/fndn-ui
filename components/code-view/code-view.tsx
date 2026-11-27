"use client";
import { ArrowDown, ArrowUp, CaretDown, CaretRight, X } from "@phosphor-icons/react";
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent } from "react";
import { Button } from "../button/button";
import { InputGroup } from "../input-group/input-group";
import { Toggle } from "../toggle/toggle";
import { Tooltip } from "../tooltip/tooltip";
import { codeView } from "./code-view.recipe";
import { CLOSED_SEARCH, CODE_VIEW_LABELS, linesOf, mountEditor, revealCurrentLine, searchCount, tokenize, watchOverflow, type CodeDiffRow, type CodeEditorHandle, type CodeSearchState, type CodeViewLabels } from "./code-view.logic";

export type { CodeDiffRow, CodePiece, CodeViewLabels } from "./code-view.logic";

/* tok and piece take no variant */
const plain = codeView();

const Tokens = ({ text }: { text: string }) => (
  <>{tokenize(text).map((t, i) => (t.tok ? <span key={i} data-slot="code-view-tok" className={plain.tok({ tok: t.tok })}>{t.text}</span> : <Fragment key={i}>{t.text}</Fragment>))}</>
);

export type CodeViewProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "defaultValue"> & {
  /** The code, lines separated by \n. Controlled with onValueChange; uncontrolled: defaultValue. */
  value?: string;
  defaultValue?: string;
  /** After every edit made in the editor (never for a value set from outside). */
  onValueChange?: (value: string) => void;
  /** Lines already highlighted elsewhere, as trusted HTML (one string per line), shown instead of `value`'s rows. Read-only only. */
  highlighted?: string[];
  /** A unified diff, shown instead of `value`. Never editable; no current line. */
  diff?: CodeDiffRow[];
  /** The accessible name: of the scroll region while it overflows, of the editor's text box. */
  label?: string;
  /** A code editor on `value` (CodeMirror, loaded only now). */
  editable?: boolean;
  /** The current line, 1-based: tinted and kept in view. Editable, it is the caret's line. */
  currentLine?: number;
  defaultCurrentLine?: number;
  onCurrentLineChange?: (line: number) => void;
  /** Long lines wrap (default). false: they scroll sideways under a gutter that stays. */
  wrap?: boolean;
  /** Fixed height in px (--fndn-code-view-height). */
  height?: number;
  /** Height in px past which the code scrolls (--fndn-code-view-max-height). */
  maxHeight?: number;
  /** As tall as its container; the code scrolls inside. */
  fill?: boolean;
  labels?: Partial<CodeViewLabels>;
};

/** Code with line numbers: a listing, a diff, or an editor. No frame of its own. */
export function CodeView({
  value, defaultValue, onValueChange, highlighted, diff, label, editable = false, currentLine, defaultCurrentLine, onCurrentLineChange,
  wrap = true, height, maxHeight, fill = false, labels, className, style, ...rest
}: CodeViewProps) {
  const [ownValue, setOwnValue] = useState(defaultValue ?? "");
  const text = value ?? ownValue;
  const [ownLine, setOwnLine] = useState(defaultCurrentLine);
  const isEditable = editable && !diff;
  /* CodeMirror draws every listing once it has loaded, read-only or not: all but a diff and lines
   * highlighted elsewhere (trusted HTML), which stay the plain listing */
  const usesEditor = !diff && (isEditable || !highlighted);
  /* an editor always has a caret, so it always has a current line (the first, unless told) */
  const line = diff ? undefined : (currentLine ?? ownLine ?? (isEditable ? 1 : undefined));
  const words: CodeViewLabels = { ...CODE_VIEW_LABELS, ...labels };
  const [ready, setReady] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const editorEl = useRef<HTMLDivElement>(null);
  const handle = useRef<CodeEditorHandle | null>(null);
  const handlers = useRef({ onValueChange, onCurrentLineChange });
  handlers.current = { onValueChange, onCurrentLineChange };
  /* the find widget: what the editor's search shows, the replace row, and a request for focus */
  const [search, setSearch] = useState<CodeSearchState>(CLOSED_SEARCH);
  const [replacing, setReplacing] = useState(false);
  const [focusFind, setFocusFind] = useState(0);

  useEffect(() => {
    if (!usesEditor || !editorEl.current) return;
    const h = mountEditor(editorEl.current, {
      value: text, editable: isEditable, wrap, currentLine: line, label, labels: words,
      onValueChange: (v) => { setOwnValue(v); handlers.current.onValueChange?.(v); },
      onCurrentLineChange: (n) => { setOwnLine(n); handlers.current.onCurrentLineChange?.(n); },
      onSearch: (next) => setSearch((prev) => { if (next.open && !prev.open) { setReplacing(false); setFocusFind((n) => n + 1); } return next; }),
      onSearchFocus: () => setFocusFind((n) => n + 1),
    }, () => setReady(true));
    handle.current = h;
    return () => { h.destroy(); handle.current = null; setReady(false); setSearch(CLOSED_SEARCH); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usesEditor]);
  useEffect(() => { handle.current?.update({ value: text, editable: isEditable, wrap, currentLine: line, label, labels: words }); });

  /* the field takes the focus, its text selected, when the widget opens or Mod+F asks again */
  useEffect(() => {
    if (!focusFind) return;
    const field = root.current?.querySelector<HTMLInputElement>("input[data-code-view=search-field]");
    field?.focus();
    field?.select();
  }, [focusFind]);
  const act = handle.current?.search;
  const findKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") { event.preventDefault(); if (event.shiftKey) act?.previous(); else act?.next(); }
    else if (act?.key(event.nativeEvent)) event.preventDefault();
  };
  const replaceKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") { event.preventDefault(); act?.replace(); }
    else if (act?.key(event.nativeEvent)) event.preventDefault();
  };

  const showListing = !(usesEditor && ready);
  /* the listing: a named scroll region while it overflows, its current line kept in view */
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => (showListing && body.current ? watchOverflow(body.current, label) : undefined), [showListing, label]);
  useLayoutEffect(() => { if (showListing) revealCurrentLine(root.current); }, [line, showListing]);

  const vars: Record<string, string> = {};
  if (maxHeight != null) vars["--fndn-code-view-max-height"] = `${maxHeight}px`;
  if (height != null) vars["--fndn-code-view-height"] = `${height}px`;
  const rootStyle = Object.keys(vars).length ? ({ ...style, ...vars } as CSSProperties) : style;
  const r = codeView({ diff: !!diff, wrap, fold: !diff, ready, fill });
  const rows = !diff && (isEditable || !highlighted) ? linesOf(text) : undefined;

  return (
    <div ref={root} data-slot="code-view" className={r.base({ class: className })} style={rootStyle} {...rest}>
      {showListing && (
        <div ref={body} data-slot="code-view-body" className={r.body()}>
          <div data-slot="code-view-rows" className={r.rows()}>
            {diff
              ? diff.map((row, i) => (
                  <div key={i} data-slot="code-view-row" className={r.row({ type: row.type })}>
                    {row.type !== "ctx" && <span data-slot="code-view-bar" className={r.bar({ type: row.type })} aria-hidden="true" />}
                    <span data-slot="code-view-num" className={r.num({ type: row.type })}>{(row.type === "del" ? row.old : row.cur) ?? ""}</span>
                    <code data-slot="code-view-code" className={r.code()}>
                      {row.pieces.map((p, j) => (p.change ? <span key={j} data-slot="code-view-piece" className={plain.piece({ change: p.change })}><Tokens text={p.text} /></span> : <Tokens key={j} text={p.text} />))}
                    </code>
                  </div>
                ))
              : rows
                ? rows.map((source, i) => (
                    <div key={i} data-slot="code-view-row" className={r.row({ current: line === i + 1 })} aria-current={line === i + 1 ? "true" : undefined}>
                      <span data-slot="code-view-num" className={r.num({ current: line === i + 1 })}>{i + 1}</span>
                      <code data-slot="code-view-code" className={r.code()}><Tokens text={source} /></code>
                    </div>
                  ))
                : highlighted!.map((html, i) => (
                    <div key={i} data-slot="code-view-row" className={r.row({ current: line === i + 1 })} aria-current={line === i + 1 ? "true" : undefined}>
                      <span data-slot="code-view-num" className={r.num({ current: line === i + 1 })}>{i + 1}</span>
                      <code data-slot="code-view-code" className={r.code()} dangerouslySetInnerHTML={{ __html: html }} />
                    </div>
                  ))}
          </div>
        </div>
      )}
      {usesEditor && (
        <>
          <span data-slot="code-view-icons" className={r.icons()} aria-hidden="true"><CaretDown data-slot="icon" weight="bold" /></span>
          <div ref={editorEl} data-slot="code-view-editor" className={r.editor()} />
          {ready && search.open && (
            <div data-slot="code-view-search" className={r.search()}>
              <div data-slot="code-view-search-row" className={r.searchRow()}>
                {isEditable && <Button
                  data-code-view="search-expand" className={r.searchExpand()} variant="ghost" size="xs" square muted aria-label={words.toggleReplace} aria-expanded={replacing}
                  icon={<CaretRight data-slot="icon" weight="bold" />} onClick={() => setReplacing((v) => !v)}
                />}
                <InputGroup
                  data-code-view="search-field" className={r.searchField()} size="sm" mono aria-label={words.find} placeholder={words.find} spellCheck={false}
                  value={search.search} onChange={(e) => act?.set({ search: e.currentTarget.value })} onKeyDown={findKey}
                  end={
                    <>
                      <Toggle variant="ghost" size="xs" square muted tooltip={words.matchCase} pressed={search.caseSensitive} onPressedChange={(v) => act?.set({ caseSensitive: v })}>Aa</Toggle>
                      <Toggle variant="ghost" size="xs" square muted tooltip={words.wholeWord} pressed={search.wholeWord} onPressedChange={(v) => act?.set({ wholeWord: v })}>ab</Toggle>
                      <Toggle variant="ghost" size="xs" square muted tooltip={words.regexp} pressed={search.regexp} onPressedChange={(v) => act?.set({ regexp: v })}>.*</Toggle>
                    </>
                  }
                />
                <span data-slot="code-view-search-count" className={r.searchCount()} role="status">{searchCount(search, words)}</span>
                <Tooltip content={words.previous} shortcut="Shift+Enter">
                  <Button variant="ghost" size="xs" square muted aria-label={words.previous} icon={<ArrowUp data-slot="icon" weight="bold" />} onClick={() => act?.previous()} />
                </Tooltip>
                <Tooltip content={words.next} shortcut="Enter">
                  <Button variant="ghost" size="xs" square muted aria-label={words.next} icon={<ArrowDown data-slot="icon" weight="bold" />} onClick={() => act?.next()} />
                </Tooltip>
                <Tooltip content={words.close} shortcut="Esc">
                  <Button variant="ghost" size="xs" square muted aria-label={words.close} icon={<X data-slot="icon" weight="bold" />} onClick={() => act?.close()} />
                </Tooltip>
              </div>
              {isEditable && replacing && (
                <div data-slot="code-view-search-row" className={r.searchRow()}>
                  <InputGroup
                    data-code-view="replace-field" className={r.replaceField()} size="sm" mono aria-label={words.replace} placeholder={words.replace} spellCheck={false}
                    value={search.replace} onChange={(e) => act?.set({ replace: e.currentTarget.value })} onKeyDown={replaceKey}
                  />
                  <Button variant="ghost" size="xs" muted onClick={() => act?.replace()}>{words.replaceOne}</Button>
                  <Button variant="ghost" size="xs" muted onClick={() => act?.replaceAll()}>{words.replaceAll}</Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
