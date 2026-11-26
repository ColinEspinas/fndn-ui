<!-- A line-numbered listing, a unified diff, tabbed files or a one-line command. -->
<script lang="ts">
  import Check from "phosphor-svelte/lib/CheckIcon";
  import Code from "phosphor-svelte/lib/CodeIcon";
  import Copy from "phosphor-svelte/lib/CopyIcon";
  import Button from "../button/Button.svelte";
  import { button } from "../button/button.recipe";
  import { codeBlock } from "./code-block.recipe";
  import Pager from "../pager/Pager.svelte";
  import Select from "../select/Select.svelte";
  import Tabs from "../tabs/Tabs.svelte";
  import { createCopier, revealCurrentLine, tokenize, watchFileTabs, watchOverflow } from "./code-block.logic";
  import { untrack } from "svelte";
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

  type Props = {
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
    /** Two-way bindable: <CodeBlock bind:file /> (the active file's path). */
    file?: string;
    onfilechange?: (path: string) => void;
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
    oncopy?: (text: string) => void;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    variant = "code", filename = "example.ts", lines = [], highlighted, code, diff = [], files, file = $bindable(), onfilechange, maxHeight, height, fill = false, currentLine, wrap, editor = false, labels, oncopy,
    class: className, style, ...data
  }: Props = $props();

  /* names of choices are shown whole: the file tabs while they fit, else a pager and a select */
  let fit = $state(true);
  const isEditor = $derived(editor && variant !== "command");
  const r = $derived(codeBlock({ variant, files: !isEditor && !!files?.length, fit: fit ? "tabs" : "select", fill: fill && variant !== "command", editor: isEditor, wrap: wrap ?? !isEditor }));
  /* tok and piece take no variant */
  const plain = codeBlock();
  /* the two labels of Copy are label parts of the button */
  const copyLabel = button({ variant: "ghost", size: "xs", shape: "rounded", muted: true }).label();

  const text = $derived<CodeBlockLabels>({ copy: "Copy", copied: "Copied", copyCode: "Copy code", files: "Files", file: "File", previousFile: "Previous file", nextFile: "Next file", ...labels });
  const raw = $derived(code ?? lines.join("\n"));
  const added = $derived(diff.filter((r) => r.type === "add").length);
  const removed = $derived(diff.filter((r) => r.type === "del").length);
  const hasFiles = $derived(!isEditor && !!files?.length);
  const rootStyle = $derived([style, maxHeight == null ? "" : `--fndn-code-block-max-height: ${maxHeight}px`, height == null ? "" : `--fndn-code-block-height: ${height}px`].filter(Boolean).join("; ") || undefined);
  const fileItems = $derived((files ?? []).map((f) => ({ value: f.path, label: f.label ?? f.path })));
  const fileOf = (path: string) => files?.find((f) => f.path === path);
  const activePath = $derived(file !== undefined && files?.some((f) => f.path === file) ? file : files?.[0]?.path ?? "");
  const fileCode = (f?: CodeBlockFile) => (f ? f.code ?? (f.lines ?? []).join("\n") : "");
  const activeIndex = $derived(Math.max(0, (files ?? []).findIndex((f) => f.path === activePath)));
  function choose(path: string) { if (path === activePath) return; file = path; onfilechange?.(path); }

  /* one "Copied" at a time: the key of the copy button that just copied */
  let copied = $state<string | null>(null);
  let pending: string | null = null;
  const copier = createCopier((value) => { copied = value ? pending : null; });
  async function copy(key: string, value: string) { pending = key; if (await copier.copy(value)) oncopy?.(value); }
  /* "Copied" belongs to the file that was copied: another file starts with a fresh Copy (keyed, so no fade) */
  $effect.pre(() => { void activePath; untrack(() => { copier.stop(); copied = null; }); });
  $effect(() => () => copier.stop());

  /* each body becomes a named scroll region while it overflows */
  let root = $state<HTMLElement | null>(null);
  $effect(() => {
    const names = hasFiles ? (files ?? []).map((f) => f.path) : [filename];
    void variant;
    const stops = Array.from(root?.querySelectorAll<HTMLElement>("[data-slot=code-block-body]") ?? []).map((b, i) => watchOverflow(b, names[i] ?? filename));
    return () => stops.forEach((s) => s());
  });

  const fileKey = $derived((files ?? []).map((f) => `${f.path}\u0000${f.label ?? ""}`).join("\u0001"));
  $effect(() => {
    const el = root;
    void fileKey;
    if (!hasFiles || !el) return;
    return watchFileTabs(el, (fits) => {
      const at = document.activeElement;
      const refocus = !!at && el.contains(at) && !!at.closest("[data-slot=tabs-list], [data-slot=pager], [data-slot=select]");
      fit = fits;
      if (refocus) queueMicrotask(() => el.querySelector<HTMLElement>(fits ? '[data-slot=tabs-trigger][aria-selected="true"]' : "[data-slot=select] [data-slot=select-trigger]")?.focus());
    });
  });
  /* the current line stays in view when it (or the open file) changes; the page never scrolls */
  $effect(() => {
    void currentLine;
    void activePath;
    revealCurrentLine(root);
  });
  /* the path, a file name and the file select's value are cut in the middle, so the file name stays (full text in title) */
  $effect(() => {
    void variant;
    void hasFiles;
    return middleTruncation(root, "[data-slot=code-block-path], [data-slot=code-block-filename], [data-slot=select] [data-slot=select-value]", { when: looksLikePath });
  });
</script>

{#snippet tokens(source: string)}{#each tokenize(source) as t, k (k)}{#if t.tok}<span data-slot="code-block-tok" class={plain.tok({ tok: t.tok })}>{t.text}</span>{:else}{t.text}{/if}{/each}{/snippet}

{#snippet copyButton(key: string, value: string)}
  <Button data-code-block="copy" class={r.copy({ copied: copied === key })} variant="ghost" size="xs" shape="rounded" muted swapped={copied === key} aria-label={text.copyCode} disabled={!value} onclick={() => copy(key, value)}>
    {#snippet icon()}<Copy data-slot="icon" weight="bold" /><Check data-slot="icon" weight="bold" />{/snippet}
    <span data-slot="button-label" class={copyLabel} aria-hidden="true">{text.copy}</span><span data-slot="button-label" class={copyLabel} aria-hidden="true">{text.copied}</span>
  </Button>
  <span data-slot="code-block-status" class="sr-only" role="status">{copied === key ? text.copied : ""}</span>
{/snippet}

{#snippet plainRows(source: string[] | undefined, html: string[] | undefined, current: number | undefined)}
  {#if html}
    {#each html as h, i (i)}
      <div data-slot="code-block-row" class={r.row({ current: current === i + 1 })} aria-current={current === i + 1 ? "true" : undefined}><span data-slot="code-block-num" class={r.num({ current: current === i + 1 })}>{i + 1}</span><code data-slot="code-block-code" class={r.code()}>{@html h}</code></div>
    {/each}
  {:else}
    {#each source ?? [] as line, i (i)}
      <div data-slot="code-block-row" class={r.row({ current: current === i + 1 })} aria-current={current === i + 1 ? "true" : undefined}>
        <span data-slot="code-block-num" class={r.num({ current: current === i + 1 })}>{i + 1}</span>
        <code data-slot="code-block-code" class={r.code()}>{@render tokens(line)}</code>
      </div>
    {/each}
  {/if}
{/snippet}

{#if variant === "command"}
  <div bind:this={root} {...data} data-slot="code-block" class={r.base({ class: className as string | undefined })} style={rootStyle}>
    <div data-slot="code-block-command" class={r.command()}>
      <code data-slot="code-block-code" class={r.code()}>{raw}</code>
      {@render copyButton("main", raw)}
    </div>
  </div>
{:else if hasFiles}
  <div bind:this={root} {...data} data-slot="code-block" class={r.base({ class: className as string | undefined })} style={rootStyle}>
    <Tabs variant="underline" inHeader headerClass={r.header()} headerProps={{ "data-code-block": "header" }} aria-label={text.files} items={fileItems} value={activePath} onvaluechange={choose}>
      {#snippet end()}
        {#if !fit}
          <Pager class={r.pager()} count={files!.length} page={activeIndex} loop label={text.files} unit={text.file} prevLabel={text.previousFile} nextLabel={text.nextFile} onpagechange={(p) => choose(files![p]!.path)} />
          <Select class={r.fileSelect()} size="sm" variant="subtle" aria-label={text.file} items={fileItems} value={activePath} onvaluechange={(v) => v && choose(v)} />
        {/if}
        <span data-slot="code-block-path" class={r.path()}>{activePath}</span>
        {#key activePath}{@render copyButton("main", fileCode(fileOf(activePath)))}{/key}
      {/snippet}
      {#snippet panel({ item })}
        <div data-slot="code-block-body" class={r.body()}><div data-slot="code-block-rows" class={r.rows()}>{@render plainRows(fileOf(item.value)?.lines, fileOf(item.value)?.highlighted, item.value === activePath ? currentLine : undefined)}</div></div>
      {/snippet}
    </Tabs>
  </div>
{:else}
  <div bind:this={root} {...data} data-slot="code-block" class={r.base({ class: className as string | undefined })} style={rootStyle}>
    {#if !isEditor}
      <div data-slot="code-block-header" class={r.header()}>
        <Code data-slot="code-block-file-icon" class={r.fileIcon()} weight="bold" aria-hidden="true" />
        <span data-slot="code-block-filename" class={r.filename()}>{filename}</span>
        {#if variant === "diff"}
          <span data-slot="code-block-stat" class={r.stat()}><span>+{added}</span><span>-{removed}</span></span>
        {:else}
          {@render copyButton("main", raw)}
        {/if}
      </div>
    {/if}
    <div data-slot="code-block-body" class={r.body()}>
      <div data-slot="code-block-rows" class={r.rows()}>
        {#if variant === "diff"}
          {#each diff as row, i (i)}
            <div data-slot="code-block-row" class={r.row({ type: row.type })}>
              {#if row.type !== "ctx"}<span data-slot="code-block-bar" class={r.bar({ type: row.type })} aria-hidden="true"></span>{/if}
              <span data-slot="code-block-num" class={r.num({ type: row.type })}>{(row.type === "del" ? row.old : row.cur) ?? ""}</span>
              <code data-slot="code-block-code" class={r.code()}>{#each row.pieces as p, j (j)}{#if p.change}<span data-slot="code-block-piece" class={plain.piece({ change: p.change })}>{@render tokens(p.text)}</span>{:else}{@render tokens(p.text)}{/if}{/each}</code>
            </div>
          {/each}
        {:else}
          {@render plainRows(lines, highlighted, currentLine)}
        {/if}
      </div>
    </div>
  </div>
{/if}
