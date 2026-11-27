<!-- A line-numbered listing, a unified diff, tabbed files or a one-line command. -->
<script lang="ts">
  import Check from "phosphor-svelte/lib/CheckIcon";
  import Code from "phosphor-svelte/lib/CodeIcon";
  import Copy from "phosphor-svelte/lib/CopyIcon";
  import Button from "../button/Button.svelte";
  import { button } from "../button/button.recipe";
  import CodeView from "../code-view/CodeView.svelte";
  import type { CodeDiffRow, CodeViewLabels } from "../code-view/code-view.logic";
  import { codeBlock } from "./code-block.recipe";
  import Pager from "../pager/Pager.svelte";
  import Select from "../select/Select.svelte";
  import Tabs from "../tabs/Tabs.svelte";
  import { createCopier, watchFileTabs } from "./code-block.logic";
  import { untrack } from "svelte";
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

  type Props = {
    /** code: line-numbered listing. diff: unified diff. command: one line to copy, no header and no numbers. */
    variant?: "code" | "diff" | "command";
    filename?: string;
    /** Two-way bindable: <CodeBlock bind:value /> (the code, lines separated by \n: shown and copied). */
    value?: string;
    /** After every edit in the editor (editable): the text of the block, or of the open file. */
    onvaluechange?: (value: string) => void;
    /** Lines already highlighted elsewhere, as trusted HTML (one string per line), shown instead of `value`. Display only. */
    highlighted?: string[];
    diff?: CodeDiffRow[];
    /** Files shown as tabs in the one header row, with the active file's path and Copy. Replaces filename / value. */
    files?: CodeBlockFile[];
    /** Two-way bindable: <CodeBlock bind:file /> (the active file's path). */
    file?: string;
    onfilechange?: (path: string) => void;
    /** Height in px of the code past which it scrolls. */
    maxHeight?: number;
    /** Fixed height in px of the code: the box keeps its size whatever the code. */
    height?: number;
    /** Fill the container's height: the code takes what the header leaves and scrolls. */
    fill?: boolean;
    /** The current line (1-based) of the listing, or of the active file. */
    currentLine?: number;
    oncurrentlinechange?: (line: number) => void;
    /** Long lines wrap (default). Off: lines never wrap, the code scrolls sideways and the gutter stays. */
    wrap?: boolean;
    /** The code is an editor (the Code View's editable); Copy takes the edited text. Not for a diff or a command. */
    editable?: boolean;
    labels?: Partial<CodeBlockLabels>;
    oncopy?: (text: string) => void;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    variant = "code", filename = "example.ts", value = $bindable(""), onvaluechange, highlighted, diff = [], files, file = $bindable(), onfilechange, maxHeight, height, fill = false,
    currentLine, oncurrentlinechange, wrap = true, editable = false, labels, oncopy, class: className, style, ...data
  }: Props = $props();

  /* names of choices are shown whole: the file tabs while they fit, else a pager and a select */
  let fit = $state(true);
  const hasFiles = $derived(variant !== "command" && !!files?.length);
  const r = $derived(codeBlock({ variant, files: hasFiles, fit: fit ? "tabs" : "select", fill: fill && variant !== "command" }));
  /* the two labels of Copy are label parts of the button */
  const copyLabel = button({ variant: "ghost", size: "xs", shape: "rounded", muted: true }).label();

  const text = $derived<OwnLabels & Partial<CodeViewLabels>>({ copy: "Copy", copied: "Copied", copyCode: "Copy code", files: "Files", file: "File", previousFile: "Previous file", nextFile: "Next file", ...labels });
  const added = $derived(diff.filter((r) => r.type === "add").length);
  const removed = $derived(diff.filter((r) => r.type === "del").length);
  const fileItems = $derived((files ?? []).map((f) => ({ value: f.path, label: f.label ?? f.path })));
  const fileOf = (path: string) => files?.find((f) => f.path === path);
  const activePath = $derived(file !== undefined && files?.some((f) => f.path === file) ? file : files?.[0]?.path ?? "");
  /* with files, the edits of each file, kept while another file is open */
  let edits = $state<Record<string, string>>({});
  const fileText = (f?: CodeBlockFile) => (f ? edits[f.path] ?? f.value ?? "" : "");
  function edit(path: string, v: string) { edits = { ...edits, [path]: v }; onvaluechange?.(v); }
  function editOwn(v: string) { value = v; onvaluechange?.(v); }
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

  let root = $state<HTMLElement | null>(null);
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
  /* the path, a file name and the file select's value are cut in the middle, so the file name stays (full text in title) */
  $effect(() => {
    void variant;
    void hasFiles;
    return middleTruncation(root, "[data-slot=code-block-path], [data-slot=code-block-filename], [data-slot=select] [data-slot=select-value]", { when: looksLikePath });
  });
</script>

{#snippet copyButton(key: string, value: string)}
  <Button data-code-block="copy" class={r.copy({ copied: copied === key })} variant="ghost" size="xs" shape="rounded" muted swapped={copied === key} aria-label={text.copyCode} disabled={!value} onclick={() => copy(key, value)}>
    {#snippet icon()}<Copy data-slot="icon" weight="bold" /><Check data-slot="icon" weight="bold" />{/snippet}
    <span data-slot="button-label" class={copyLabel} aria-hidden="true">{text.copy}</span><span data-slot="button-label" class={copyLabel} aria-hidden="true">{text.copied}</span>
  </Button>
  <span data-slot="code-block-status" class="sr-only" role="status">{copied === key ? text.copied : ""}</span>
{/snippet}

{#if variant === "command"}
  <div bind:this={root} {...data} data-slot="code-block" class={r.base({ class: className as string | undefined })} {style}>
    <div data-slot="code-block-command" class={r.command()}>
      <code data-slot="code-block-code" class={r.code()}>{value}</code>
      {@render copyButton("main", value)}
    </div>
  </div>
{:else if hasFiles}
  <div bind:this={root} {...data} data-slot="code-block" class={r.base({ class: className as string | undefined })} {style}>
    <Tabs variant="underline" inHeader headerClass={r.header()} headerProps={{ "data-code-block": "header" }} aria-label={text.files} items={fileItems} value={activePath} onvaluechange={choose}>
      {#snippet end()}
        {#if !fit}
          <Pager class={r.pager()} count={files!.length} page={activeIndex} loop label={text.files} unit={text.file} prevLabel={text.previousFile} nextLabel={text.nextFile} onpagechange={(p) => choose(files![p]!.path)} />
          <Select class={r.fileSelect()} size="sm" variant="subtle" aria-label={text.file} items={fileItems} value={activePath} onvaluechange={(v) => v && choose(v)} />
        {/if}
        <span data-slot="code-block-path" class={r.path()}>{activePath}</span>
        {#key activePath}{@render copyButton("main", fileText(fileOf(activePath)))}{/key}
      {/snippet}
      {#snippet panel({ item })}
        <CodeView
          data-code-block="view" class={r.view()} {wrap} {height} {maxHeight} labels={text} label={item.value}
          value={fileText(fileOf(item.value))} onvaluechange={(v) => edit(item.value, v)} highlighted={fileOf(item.value)?.highlighted} {editable}
          currentLine={item.value === activePath ? currentLine : undefined} {oncurrentlinechange}
        />
      {/snippet}
    </Tabs>
  </div>
{:else}
  <div bind:this={root} {...data} data-slot="code-block" class={r.base({ class: className as string | undefined })} {style}>
    <div data-slot="code-block-header" class={r.header()}>
      <Code data-slot="code-block-file-icon" class={r.fileIcon()} weight="bold" aria-hidden="true" />
      <span data-slot="code-block-filename" class={r.filename()}>{filename}</span>
      {#if variant === "diff"}
        <span data-slot="code-block-stat" class={r.stat()}><span>+{added}</span><span>-{removed}</span></span>
      {:else}
        {@render copyButton("main", value)}
      {/if}
    </div>
    {#if variant === "diff"}
      <CodeView data-code-block="view" class={r.view()} {wrap} {height} {maxHeight} labels={text} label={filename} {diff} />
    {:else}
      <CodeView
        data-code-block="view" class={r.view()} {wrap} {height} {maxHeight} labels={text} label={filename}
        {value} onvaluechange={editOwn} {highlighted} {editable} {currentLine} {oncurrentlinechange}
      />
    {/if}
  </div>
{/if}
