"use client";
import { Check, Code, Copy } from "@phosphor-icons/react";
import { useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes } from "react";
import { Button } from "../button/button";
import { button } from "../button/button.recipe";
import { CodeView, type CodeDiffRow, type CodeViewLabels } from "../code-view/code-view";
import { codeBlock } from "./code-block.recipe";
import { Pager } from "../pager/pager";
import { Select } from "../select/select";
import { Tabs } from "../tabs/tabs";
import { createCopier, watchFileTabs } from "./code-block.logic";
import { looksLikePath, middleTruncation } from "../lib/truncate";

type OwnLabels = { copy: string; copied: string; copyCode: string; files: string; file: string; previousFile: string; nextFile: string };
/** The block's words and its Code View's (the editor's), for translation. */
export type CodeBlockLabels = OwnLabels & CodeViewLabels;
/** One file of a tabbed code block. */
export type CodeBlockFile = {
  /** Shown in the file's bar, and the name of its scroll region. */
  path: string;
  /** Tab label. Defaults to the path. */
  label?: string;
  /** The file's text, lines separated by \n: shown (coloured by the light tokenizer) and copied. */
  value?: string;
  /** Lines already highlighted elsewhere, as trusted HTML (one string per line), shown instead of `value`. */
  highlighted?: string[];
};

type Recipe = ReturnType<typeof codeBlock>;
/* the two labels of Copy are label parts of the button */
const copyLabel = button({ variant: "ghost", size: "xs", shape: "rounded", muted: true }).label();

export type CodeBlockProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "onCopy" | "defaultValue"> & {
  /** code: line-numbered listing. diff: unified diff. command: one line to copy, no header and no numbers. */
  variant?: "code" | "diff" | "command";
  filename?: string;
  /** The code, lines separated by \n: shown and copied. Controlled with onValueChange; uncontrolled: defaultValue. */
  value?: string;
  defaultValue?: string;
  /** After every edit in the editor (editable): the text of the block, or of the open file. */
  onValueChange?: (value: string) => void;
  /** Lines already highlighted elsewhere, as trusted HTML (one string per line), shown instead of `value`. Display only. */
  highlighted?: string[];
  diff?: CodeDiffRow[];
  /** Files shown as tabs in the one header row, with the active file's path and Copy. Replaces filename / value. */
  files?: CodeBlockFile[];
  /** Controlled active file (its path). Omit for uncontrolled (defaultFile; defaults to the first). */
  file?: string;
  defaultFile?: string;
  onFileChange?: (path: string) => void;
  /** Height in px of the code past which it scrolls. */
  maxHeight?: number;
  /** Fixed height in px of the code: the box keeps its size whatever the code. */
  height?: number;
  /** Fill the container's height: the code takes what the header leaves and scrolls. */
  fill?: boolean;
  /** The current line (1-based) of the listing, or of the active file. */
  currentLine?: number;
  onCurrentLineChange?: (line: number) => void;
  /** Long lines wrap (default). Off: lines never wrap, the code scrolls sideways and the gutter stays. */
  wrap?: boolean;
  /** The code is an editor (the Code View's editable); Copy takes the edited text. Not for a diff or a command. */
  editable?: boolean;
  labels?: Partial<CodeBlockLabels>;
  onCopy?: (text: string) => void;
};

/* the copy button: a Button with two labels in one cell, swapped while "Copied" shows */
function CopyButton({ r, text, labels, onCopy }: { r: Recipe; text: string; labels: OwnLabels; onCopy?: (text: string) => void }) {
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

/** A line-numbered listing, a unified diff, tabbed files or a one-line command, in a card. */
export function CodeBlock({
  variant = "code", filename = "example.ts", value, defaultValue, onValueChange, highlighted, diff = [], files, file, defaultFile, onFileChange,
  maxHeight, height, fill = false, currentLine, onCurrentLineChange, wrap = true, editable = false, labels, onCopy, className, style, ...rest
}: CodeBlockProps) {
  const [current, setCurrent] = useState(defaultFile);
  const [own, setOwn] = useState(defaultValue ?? "");
  const text = value ?? own;
  /* with files, the edits of each file, kept while another file is open */
  const [edits, setEdits] = useState<Record<string, string>>({});
  const words: OwnLabels & Partial<CodeViewLabels> = { copy: "Copy", copied: "Copied", copyCode: "Copy code", files: "Files", file: "File", previousFile: "Previous file", nextFile: "Next file", ...labels };
  const root = useRef<HTMLDivElement>(null);
  const hasFiles = variant !== "command" && !!files?.length;
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
  const added = diff.filter((r) => r.type === "add").length;
  const removed = diff.filter((r) => r.type === "del").length;
  const r = codeBlock({ variant, files: hasFiles, fit: fit ? "tabs" : "select", fill: fill && variant !== "command" });
  const rootProps = { ref: root, className: r.base({ class: className }), style, ...rest };
  /* what every Code View of the block shares */
  const view = { "data-code-block": "view", className: r.view(), wrap, height, maxHeight, labels: words, onCurrentLineChange };

  if (variant === "command") {
    return (
      <div data-slot="code-block" {...rootProps}>
        <div data-slot="code-block-command" className={r.command()}>
          <code data-slot="code-block-code" className={r.code()}>{text}</code>
          <CopyButton r={r} text={text} labels={words} onCopy={onCopy} />
        </div>
      </div>
    );
  }

  if (hasFiles && files) {
    const path = file ?? current ?? files[0]!.path;
    const active = files.find((f) => f.path === path) ?? files[0]!;
    const index = files.indexOf(active);
    const textOf = (f: CodeBlockFile) => edits[f.path] ?? f.value ?? "";
    const choose = (next: string) => { if (next === active.path) return; setCurrent(next); onFileChange?.(next); };
    const edit = (f: CodeBlockFile, v: string) => { setEdits((e) => ({ ...e, [f.path]: v })); onValueChange?.(v); };
    return (
      <div data-slot="code-block" {...rootProps}>
        <Tabs
          variant="underline"
          inHeader
          headerClass={r.header()}
          headerProps={{ "data-code-block": "header" }}
          aria-label={words.files}
          value={active.path}
          onValueChange={choose}
          items={files.map((f) => ({
            value: f.path,
            label: f.label ?? f.path,
            content: <CodeView {...view} label={f.path} value={textOf(f)} onValueChange={(v) => edit(f, v)} highlighted={f.highlighted} editable={editable} currentLine={f.path === active.path ? currentLine : undefined} />,
          }))}
          end={
            <>
              {!fit && (
                <>
                  <Pager className={r.pager()} count={files.length} page={index} loop label={words.files} unit={words.file} prevLabel={words.previousFile} nextLabel={words.nextFile} onPageChange={(p) => choose(files[p]!.path)} />
                  <Select className={r.fileSelect()} size="sm" variant="subtle" aria-label={words.file} items={files.map((f) => ({ value: f.path, label: f.label ?? f.path }))} value={active.path} onValueChange={(v) => v && choose(v)} />
                </>
              )}
              <span data-slot="code-block-path" className={r.path()}>{active.path}</span>
              <CopyButton key={active.path} r={r} text={textOf(active)} labels={words} onCopy={onCopy} />
            </>
          }
        />
      </div>
    );
  }

  const isDiff = variant === "diff";
  return (
    <div data-slot="code-block" {...rootProps}>
      <div data-slot="code-block-header" className={r.header()}>
        <Code data-slot="code-block-file-icon" className={r.fileIcon()} weight="bold" aria-hidden="true" />
        <span data-slot="code-block-filename" className={r.filename()}>{filename}</span>
        {isDiff ? (
          <span data-slot="code-block-stat" className={r.stat()}><span>{`+${added}`}</span><span>{`-${removed}`}</span></span>
        ) : (
          <CopyButton r={r} text={text} labels={words} onCopy={onCopy} />
        )}
      </div>
      {isDiff ? (
        <CodeView {...view} label={filename} diff={diff} />
      ) : (
        <CodeView {...view} label={filename} value={text} onValueChange={(v) => { setOwn(v); onValueChange?.(v); }} highlighted={highlighted} editable={editable} currentLine={currentLine} />
      )}
    </div>
  );
}
