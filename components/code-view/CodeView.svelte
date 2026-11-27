<!-- Code with line numbers: a listing, a diff, or an editor. No frame of its own. -->
<script lang="ts">
  import ArrowDown from "phosphor-svelte/lib/ArrowDownIcon";
  import ArrowUp from "phosphor-svelte/lib/ArrowUpIcon";
  import CaretDown from "phosphor-svelte/lib/CaretDownIcon";
  import CaretRight from "phosphor-svelte/lib/CaretRightIcon";
  import X from "phosphor-svelte/lib/XIcon";
  import { tick, untrack } from "svelte";
  import Button from "../button/Button.svelte";
  import InputGroup from "../input-group/InputGroup.svelte";
  import Toggle from "../toggle/Toggle.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { codeView } from "./code-view.recipe";
  import { CLOSED_SEARCH, CODE_VIEW_LABELS, linesOf, mountEditor, revealCurrentLine, searchCount, tokenize, watchOverflow, type CodeEditorHandle, type CodeSearchState } from "./code-view.logic";
  import type * as Logic from "./code-view.logic";

  /** A single run of code within a diff row; `change` tints it as an add / del. */
  export type CodePiece = Logic.CodePiece;
  /** One row of a unified diff: old / new line numbers, its kind, and its pieces. */
  export type CodeDiffRow = Logic.CodeDiffRow;
  /** The editor's words (its search panel and its folds), for translation. */
  export type CodeViewLabels = Logic.CodeViewLabels;

  type Props = {
    /** Two-way bindable: <CodeView bind:value /> (the code, lines separated by \n). */
    value?: string;
    /** After every edit made in the editor (never for a value set from outside). */
    onvaluechange?: (value: string) => void;
    /** Lines already highlighted elsewhere, as trusted HTML (one string per line), shown instead of `value`'s rows. Read-only only. */
    highlighted?: string[];
    /** A unified diff, shown instead of `value`. Never editable; no current line. */
    diff?: CodeDiffRow[];
    /** The accessible name: of the scroll region while it overflows, of the editor's text box. */
    label?: string;
    /** A code editor on `value` (CodeMirror, loaded only now). */
    editable?: boolean;
    /** Two-way bindable: the current line, 1-based; editable, the caret's line. */
    currentLine?: number;
    oncurrentlinechange?: (line: number) => void;
    /** Long lines wrap (default). false: they scroll sideways under a gutter that stays. */
    wrap?: boolean;
    /** Fixed height in px (--fndn-code-view-height). */
    height?: number;
    /** Height in px past which the code scrolls (--fndn-code-view-max-height). */
    maxHeight?: number;
    /** As tall as its container; the code scrolls inside. */
    fill?: boolean;
    labels?: Partial<CodeViewLabels>;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    value = $bindable(""), onvaluechange, highlighted, diff, label, editable = false, currentLine = $bindable(), oncurrentlinechange,
    wrap = true, height, maxHeight, fill = false, labels, class: className, style, ...rest
  }: Props = $props();

  /* tok and piece take no variant */
  const plain = codeView();
  const isEditable = $derived(editable && !diff);
  /* an editor always has a caret, so it always has a current line (the first, unless told) */
  const line = $derived(diff ? undefined : (currentLine ?? (isEditable ? 1 : undefined)));
  const words = $derived<CodeViewLabels>({ ...CODE_VIEW_LABELS, ...labels });
  let ready = $state(false);
  const r = $derived(codeView({ diff: !!diff, wrap, fold: isEditable, ready, fill }));
  const rows = $derived(!diff && (isEditable || !highlighted) ? linesOf(value) : undefined);
  const showListing = $derived(!(isEditable && ready));
  const rootStyle = $derived([style, maxHeight == null ? "" : `--fndn-code-view-max-height: ${maxHeight}px`, height == null ? "" : `--fndn-code-view-height: ${height}px`].filter(Boolean).join("; ") || undefined);

  let root = $state<HTMLElement | null>(null);
  let body = $state<HTMLElement | null>(null);
  let editorEl = $state<HTMLElement | null>(null);
  let handle = $state.raw<CodeEditorHandle | null>(null);
  /* the find widget: what the editor's search shows, and the replace row */
  let search = $state<CodeSearchState>(CLOSED_SEARCH);
  let replacing = $state(false);
  /* the field takes the focus, its text selected, when the widget opens or Mod+F asks again */
  function focusFind() {
    void tick().then(() => {
      const field = root?.querySelector<HTMLInputElement>("input[data-code-view=search-field]");
      field?.focus();
      field?.select();
    });
  }
  function findKey(event: KeyboardEvent) {
    if (event.key === "Enter") { event.preventDefault(); if (event.shiftKey) handle?.search.previous(); else handle?.search.next(); }
    else if (handle?.search.key(event)) event.preventDefault();
  }
  function replaceKey(event: KeyboardEvent) {
    if (event.key === "Enter") { event.preventDefault(); handle?.search.replace(); }
    else if (handle?.search.key(event)) event.preventDefault();
  }
  $effect(() => {
    const el = editorEl;
    if (!isEditable || !el) return;
    const h = untrack(() => mountEditor(el, {
      value, wrap, currentLine: line, label, labels: words,
      onValueChange: (v) => { value = v; onvaluechange?.(v); },
      onCurrentLineChange: (n) => { currentLine = n; oncurrentlinechange?.(n); },
      onSearch: (next) => { if (next.open && !search.open) { replacing = false; focusFind(); } search = next; },
      onSearchFocus: focusFind,
    }, () => { ready = true; }));
    handle = h;
    return () => { h.destroy(); handle = null; ready = false; search = CLOSED_SEARCH; };
  });
  $effect(() => { const h = handle; const next = { value, wrap, currentLine: line, label, labels: words }; untrack(() => h?.update(next)); });

  /* the listing: a named scroll region while it overflows, its current line kept in view */
  $effect(() => (body ? watchOverflow(body, label) : undefined));
  $effect(() => {
    void line;
    if (showListing) revealCurrentLine(root);
  });
</script>

{#snippet tokens(source: string)}{#each tokenize(source) as t, k (k)}{#if t.tok}<span data-slot="code-view-tok" class={plain.tok({ tok: t.tok })}>{t.text}</span>{:else}{t.text}{/if}{/each}{/snippet}

<div bind:this={root} {...rest} data-slot="code-view" class={r.base({ class: className as string | undefined })} style={rootStyle}>
  {#if showListing}
    <div bind:this={body} data-slot="code-view-body" class={r.body()}>
      <div data-slot="code-view-rows" class={r.rows()}>
        {#if diff}
          {#each diff as row, i (i)}
            <div data-slot="code-view-row" class={r.row({ type: row.type })}>
              {#if row.type !== "ctx"}<span data-slot="code-view-bar" class={r.bar({ type: row.type })} aria-hidden="true"></span>{/if}
              <span data-slot="code-view-num" class={r.num({ type: row.type })}>{(row.type === "del" ? row.old : row.cur) ?? ""}</span>
              <code data-slot="code-view-code" class={r.code()}>{#each row.pieces as p, j (j)}{#if p.change}<span data-slot="code-view-piece" class={plain.piece({ change: p.change })}>{@render tokens(p.text)}</span>{:else}{@render tokens(p.text)}{/if}{/each}</code>
            </div>
          {/each}
        {:else if rows}
          {#each rows as source, i (i)}
            <div data-slot="code-view-row" class={r.row({ current: line === i + 1 })} aria-current={line === i + 1 ? "true" : undefined}>
              <span data-slot="code-view-num" class={r.num({ current: line === i + 1 })}>{i + 1}</span>
              <code data-slot="code-view-code" class={r.code()}>{@render tokens(source)}</code>
            </div>
          {/each}
        {:else}
          {#each highlighted ?? [] as h, i (i)}
            <div data-slot="code-view-row" class={r.row({ current: line === i + 1 })} aria-current={line === i + 1 ? "true" : undefined}>
              <span data-slot="code-view-num" class={r.num({ current: line === i + 1 })}>{i + 1}</span>
              <code data-slot="code-view-code" class={r.code()}>{@html h}</code>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
  {#if isEditable}
    <span data-slot="code-view-icons" class={r.icons()} aria-hidden="true"><CaretDown data-slot="icon" weight="bold" /></span>
    <div bind:this={editorEl} data-slot="code-view-editor" class={r.editor()}></div>
    {#if ready && search.open}
      <div data-slot="code-view-search" class={r.search()}>
        <div data-slot="code-view-search-row" class={r.searchRow()}>
          <Button data-code-view="search-expand" class={r.searchExpand()} variant="ghost" size="xs" square muted aria-label={words.toggleReplace} aria-expanded={replacing} onclick={() => (replacing = !replacing)}>
            {#snippet icon()}<CaretRight data-slot="icon" weight="bold" />{/snippet}
          </Button>
          <InputGroup
            data-code-view="search-field" class={r.searchField()} size="sm" mono aria-label={words.find} placeholder={words.find} spellcheck="false"
            value={search.search} oninput={(v) => handle?.search.set({ search: v })} onkeydown={findKey}
          >
            {#snippet end()}
              <Toggle variant="ghost" size="xs" square muted tooltip={words.matchCase} pressed={search.caseSensitive} onpressedchange={(v) => handle?.search.set({ caseSensitive: v })}>Aa</Toggle>
              <Toggle variant="ghost" size="xs" square muted tooltip={words.wholeWord} pressed={search.wholeWord} onpressedchange={(v) => handle?.search.set({ wholeWord: v })}>ab</Toggle>
              <Toggle variant="ghost" size="xs" square muted tooltip={words.regexp} pressed={search.regexp} onpressedchange={(v) => handle?.search.set({ regexp: v })}>.*</Toggle>
            {/snippet}
          </InputGroup>
          <span data-slot="code-view-search-count" class={r.searchCount()} role="status">{searchCount(search, words)}</span>
          <Tooltip content={words.previous} shortcut="Shift+Enter">
            {#snippet trigger(props)}
              <Button {...props()} variant="ghost" size="xs" square muted aria-label={words.previous} onclick={() => handle?.search.previous()}>{#snippet icon()}<ArrowUp data-slot="icon" weight="bold" />{/snippet}</Button>
            {/snippet}
          </Tooltip>
          <Tooltip content={words.next} shortcut="Enter">
            {#snippet trigger(props)}
              <Button {...props()} variant="ghost" size="xs" square muted aria-label={words.next} onclick={() => handle?.search.next()}>{#snippet icon()}<ArrowDown data-slot="icon" weight="bold" />{/snippet}</Button>
            {/snippet}
          </Tooltip>
          <Tooltip content={words.close} shortcut="Esc">
            {#snippet trigger(props)}
              <Button {...props()} variant="ghost" size="xs" square muted aria-label={words.close} onclick={() => handle?.search.close()}>{#snippet icon()}<X data-slot="icon" weight="bold" />{/snippet}</Button>
            {/snippet}
          </Tooltip>
        </div>
        {#if replacing}
          <div data-slot="code-view-search-row" class={r.searchRow()}>
            <InputGroup
              data-code-view="replace-field" class={r.replaceField()} size="sm" mono aria-label={words.replace} placeholder={words.replace} spellcheck="false"
              value={search.replace} oninput={(v) => handle?.search.set({ replace: v })} onkeydown={replaceKey}
            />
            <Button variant="ghost" size="xs" muted onclick={() => handle?.search.replace()}>{words.replaceOne}</Button>
            <Button variant="ghost" size="xs" muted onclick={() => handle?.search.replaceAll()}>{words.replaceAll}</Button>
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>
