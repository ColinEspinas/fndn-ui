"use client";
import { Check, Code, Copy } from "@phosphor-icons/react";
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from "react";
import { Button } from "../button/button";
import { button } from "../button/button.recipe";
import { codeBlock } from "./code-block.recipe";
import { Pager } from "../pager/pager";
import { Select } from "../select/select";
import { Tabs } from "../tabs/tabs";
import { createCopier, revealCurrentLine, tokenize, watchFileTabs, watchOverflow } from "./code-block.logic";
import { looksLikePath, middleTruncation } from "../lib/truncate";

/* A single run of code within a diff row; `change` tints it as an add/del. */
export type CodePiece = { text: string; change?: "add" | "del" };
/* One row of a unified diff: old/new line numbers, its kind, and its pieces. */
export type CodeDiffRow = { old: number | null; cur: number | null; type: "ctx" | "add" | "del"; pieces: CodePiece[] };
export type CodeBlockLabels = { copy: string; copied: string; copyCode: string; files: string; file: string; previousFile: string; nextFile: string };
/** One file of a tabbed code block. */
export type CodeBlockFile = {
  /** Shown in the file's bar, and the name of its scroll region. */
  path: string;
  /** Tab label. Defaults to the path. */
  label?: string;
  /** Plain lines, coloured by the light tokenizer. */
  lines?: string[];
  /** Lines already highlighted elsewhere, as trusted HTML (one string per line). */
  highlighted?: string[];
  /** Raw text placed on the clipboard. Defaults to `lines` joined. */
  code?: string;
};

type Recipe = ReturnType<typeof codeBlock>;
/* tok and piece take no variant */
const plain = codeBlock();
/* the two labels of Copy are label parts of the button */
const copyLabel = button({ variant: "ghost", size: "xs", shape: "rounded", muted: true }).label();

const Tokens = ({ text }: { text: string }) => (
  <>{tokenize(text).map((t, i) => (t.tok ? <span key={i} data-slot="code-block-tok" className={plain.tok({ tok: t.tok })}>{t.text}</span> : <Fragment key={i}>{t.text}</Fragment>))}</>
);

export type CodeBlockProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "onCopy"> & {
  /** code: line-numbered listing. diff: unified diff. command: one line to copy, no header and no numbers. */
  variant?: "code" | "diff" | "command";
  filename?: string;
  lines?: string[];
  /** Lines already highlighted elsewhere, as trusted HTML (one string per line), shown instead of `lines`. */
  highlighted?: string[];
  /** Raw text placed on the clipboard by Copy. Defaults to `lines` joined. */
  code?: string;
  diff?: CodeDiffRow[];
  /** Files shown as tabs in the one header row, with the active file's path and Copy. Replaces filename / lines. */
  files?: CodeBlockFile[];
  /** Controlled active file (its path). Omit for uncontrolled (defaultFile; defaults to the first). */
  file?: string;
  defaultFile?: string;
  onFileChange?: (path: string) => void;
  /** Body height in px past which the code scrolls (--fndn-code-block-max-height). */
  maxHeight?: number;
  /** Fixed body height in px (--fndn-code-block-height): the box keeps its size whatever the code. */
  height?: number;
  /** Fill the container's height (an editor pane): the body takes what the header leaves and scrolls. */
  fill?: boolean;
  /** The current line (1-based) of the listing, or of the active file: tinted, its number in ink. */
  currentLine?: number;
  /** Long lines wrap (default). Off: lines never wrap, the body scrolls sideways and the gutter stays. Off by default in the editor look. */
  wrap?: boolean;
  /** The body of an editor pane: no frame, no header, no copy, no path (the host gives the file tabs); fills its container. Shows `lines`, `highlighted` or `diff`; ignores `files`. */
  editor?: boolean;
  labels?: Partial<CodeBlockLabels>;
  onCopy?: (text: string) => void;
};

/* the copy button: a Button with two labels in one cell, swapped while "Copied" shows */
function CopyButton({ r, text, labels, onCopy }: { r: Recipe; text: string; labels: CodeBlockLabels; onCopy?: (text: string) => void }) {
  const [copied, setCopied] = useState(false);
  const copier = useRef<ReturnType<typeof createCopier>>(null);
  useEffect(() => { const c = createCopier(setCopied); copier.current = c; return () => c.stop(); }, []);
  const copy = async () => { if (await copier.current?.copy(text)) onCopy?.(text); };
  return (
    <>
      <Button
        data-code-block="copy" className={r.copy({ copied })} variant="ghost" size="xs" shape="rounded" muted swapped={copied} aria-label={labels.copyCode} disabled={!text} onClick={copy}
        icon={<><Copy data-slot="icon" weight="bold" /><Check data-slot="icon" weight="bold" /></>}
      >
        <span data-slot="button-label" className={copyLabel} aria-hidden="true">{labels.copy}</span>
        <span data-slot="button-label" className={copyLabel} aria-hidden="true">{labels.copied}</span>
      </Button>
      <span data-slot="code-block-status" className="sr-only" role="status">{copied ? labels.copied : ""}</span>
    </>
  );
}

/* the scrolling body: diff rows, highlighted lines, or plain lines */
function Body({ r, name, lines = [], highlighted, diff, current }: { r: Recipe; name: string; lines?: string[]; highlighted?: string[]; diff?: CodeDiffRow[]; current?: number }) {
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => (body.current ? watchOverflow(body.current, name) : undefined), [name]);
  return (
    <div ref={body} data-slot="code-block-body" className={r.body()}>
      <div data-slot="code-block-rows" className={r.rows()}>
        {diff
          ? diff.map((row, i) => (
              <div key={i} data-slot="code-block-row" className={r.row({ type: row.type })}>
                {row.type !== "ctx" && <span data-slot="code-block-bar" className={r.bar({ type: row.type })} aria-hidden="true" />}
                <span data-slot="code-block-num" className={r.num({ type: row.type })}>{(row.type === "del" ? row.old : row.cur) ?? ""}</span>
                <code data-slot="code-block-code" className={r.code()}>
                  {row.pieces.map((p, j) => (p.change ? <span key={j} data-slot="code-block-piece" className={plain.piece({ change: p.change })}><Tokens text={p.text} /></span> : <Tokens key={j} text={p.text} />))}
                </code>
              </div>
            ))
          : highlighted
            ? highlighted.map((html, i) => (
                <div key={i} data-slot="code-block-row" className={r.row({ current: current === i + 1 })} aria-current={current === i + 1 ? "true" : undefined}>
                  <span data-slot="code-block-num" className={r.num({ current: current === i + 1 })}>{i + 1}</span>
                  <code data-slot="code-block-code" className={r.code()} dangerouslySetInnerHTML={{ __html: html }} />
                </div>
              ))
            : lines.map((line, i) => (
                <div key={i} data-slot="code-block-row" className={r.row({ current: current === i + 1 })} aria-current={current === i + 1 ? "true" : undefined}>
                  <span data-slot="code-block-num" className={r.num({ current: current === i + 1 })}>{i + 1}</span>
                  <code data-slot="code-block-code" className={r.code()}><Tokens text={line} /></code>
                </div>
              ))}
      </div>
    </div>
  );
}

/** A line-numbered listing, a unified diff, tabbed files or a one-line command. */
export function CodeBlock({
  variant = "code", filename = "example.ts", lines = [], highlighted, code, diff = [], files, file, defaultFile, onFileChange,
  maxHeight, height, fill = false, currentLine, wrap, editor = false, labels, onCopy, className, style, ...rest
}: CodeBlockProps) {
  const [current, setCurrent] = useState(defaultFile);
  const text: CodeBlockLabels = { copy: "Copy", copied: "Copied", copyCode: "Copy code", files: "Files", file: "File", previousFile: "Previous file", nextFile: "Next file", ...labels };
  const root = useRef<HTMLDivElement>(null);
  const isEditor = editor && variant !== "command";
  const hasFiles = !isEditor && !!files?.length;
  /* names of choices are shown whole: the file tabs while they fit, else a pager and a select */
  const [fit, setFit] = useState(true);
  const refocus = useRef(false);
  const fileKey = hasFiles ? files!.map((f) => `${f.path}\u0000${f.label ?? ""}`).join("\u0001") : "";
  useLayoutEffect(() => {
    if (!hasFiles || !root.current) return;
    const el = root.current;
    return watchFileTabs(el, (fits) => {
      const at = document.activeElement;
      refocus.current = !!at && el.contains(at) && !!at.closest("[data-slot=tabs-list], [data-slot=pager], [data-slot=select]");
      setFit(fits);
    });
  }, [hasFiles, fileKey]);
  useLayoutEffect(() => {
    if (!refocus.current || !root.current) return;
    refocus.current = false;
    root.current.querySelector<HTMLElement>(fit ? '[data-slot=tabs-trigger][aria-selected="true"]' : "[data-slot=select] [data-slot=select-trigger]")?.focus();
  }, [fit]);
  /* the path, a file name and the file select's value are cut in the middle, so the file name stays (full text in title) */
  useLayoutEffect(() => middleTruncation(root.current, "[data-slot=code-block-path], [data-slot=code-block-filename], [data-slot=select] [data-slot=select-value]", { when: looksLikePath }), [variant, hasFiles]);
  /* the current line stays in view when it (or the open file) changes; the page never scrolls */
  useLayoutEffect(() => revealCurrentLine(root.current), [currentLine, file, current]);
  const raw = code ?? lines.join("\n");
  const added = diff.filter((r) => r.type === "add").length;
  const removed = diff.filter((r) => r.type === "del").length;
  const vars: Record<string, string> = {};
  if (maxHeight != null) vars["--fndn-code-block-max-height"] = `${maxHeight}px`;
  if (height != null) vars["--fndn-code-block-height"] = `${height}px`;
  const rootStyle = Object.keys(vars).length ? ({ ...style, ...vars } as CSSProperties) : style;
  const r = codeBlock({ variant, files: hasFiles, fit: fit ? "tabs" : "select", fill: fill && variant !== "command", editor: isEditor, wrap: wrap ?? !isEditor });
  const rootProps = { ref: root, className: r.base({ class: className }), style: rootStyle, ...rest };

  if (variant === "command") {
    return (
      <div data-slot="code-block" {...rootProps}>
        <div data-slot="code-block-command" className={r.command()}>
          <code data-slot="code-block-code" className={r.code()}>{raw}</code>
          <CopyButton r={r} text={raw} labels={text} onCopy={onCopy} />
        </div>
      </div>
    );
  }

  if (hasFiles && files) {
    const path = file ?? current ?? files[0]!.path;
    const active = files.find((f) => f.path === path) ?? files[0]!;
    const index = files.indexOf(active);
    const choose = (next: string) => { if (next === active.path) return; setCurrent(next); onFileChange?.(next); };
    return (
      <div data-slot="code-block" {...rootProps}>
        <Tabs
          variant="underline"
          inHeader
          headerClass={r.header()}
          headerProps={{ "data-code-block": "header" }}
          aria-label={text.files}
          value={active.path}
          onValueChange={choose}
          items={files.map((f) => ({ value: f.path, label: f.label ?? f.path, content: <Body r={r} name={f.path} lines={f.lines} highlighted={f.highlighted} current={f.path === active.path ? currentLine : undefined} /> }))}
          end={
            <>
              {!fit && (
                <>
                  <Pager className={r.pager()} count={files.length} page={index} loop label={text.files} unit={text.file} prevLabel={text.previousFile} nextLabel={text.nextFile} onPageChange={(p) => choose(files[p]!.path)} />
                  <Select className={r.fileSelect()} size="sm" variant="subtle" aria-label={text.file} items={files.map((f) => ({ value: f.path, label: f.label ?? f.path }))} value={active.path} onValueChange={(v) => v && choose(v)} />
                </>
              )}
              <span data-slot="code-block-path" className={r.path()}>{active.path}</span>
              <CopyButton key={active.path} r={r} text={active.code ?? (active.lines ?? []).join("\n")} labels={text} onCopy={onCopy} />
            </>
          }
        />
      </div>
    );
  }

  const isDiff = variant === "diff";
  return (
    <div data-slot="code-block" {...rootProps}>
      {!isEditor && (
      <div data-slot="code-block-header" className={r.header()}>
        <Code data-slot="code-block-file-icon" className={r.fileIcon()} weight="bold" aria-hidden="true" />
        <span data-slot="code-block-filename" className={r.filename()}>{filename}</span>
        {isDiff ? (
          <span data-slot="code-block-stat" className={r.stat()}><span>{`+${added}`}</span><span>{`-${removed}`}</span></span>
        ) : (
          <CopyButton r={r} text={raw} labels={text} onCopy={onCopy} />
        )}
      </div>
      )}
      <Body r={r} name={filename} lines={lines} highlighted={highlighted} diff={isDiff ? diff : undefined} current={isDiff ? undefined : currentLine} />
    </div>
  );
}
