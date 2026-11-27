/* code-view — framework-neutral pieces shared by the React, Vue and Svelte adapters. The editor
 * itself (CodeMirror) is in code-view.editor.ts, loaded only when a view is editable, so a
 * read-only listing never downloads it. */

export type CodeToken = { text: string; tok?: "kw" | "str" | "fn" };
/** A single run of code within a diff row; `change` tints it as an add / del. */
export type CodePiece = { text: string; change?: "add" | "del" };
/** One row of a unified diff: old / new line numbers, its kind, and its pieces. */
export type CodeDiffRow = { old: number | null; cur: number | null; type: "ctx" | "add" | "del"; pieces: CodePiece[] };
/** The editor's words (its find widget and its folds), for translation. In count and results,
 * {current} and {total} stand for the numbers. */
export type CodeViewLabels = {
  find: string; replace: string; toggleReplace: string; next: string; previous: string; close: string;
  matchCase: string; wholeWord: string; regexp: string; replaceOne: string; replaceAll: string;
  count: string; results: string; noResults: string;
  fold: string; unfold: string; folded: string;
};
export const CODE_VIEW_LABELS: CodeViewLabels = {
  find: "Find", replace: "Replace", toggleReplace: "Toggle replace", next: "Next match", previous: "Previous match", close: "Close",
  matchCase: "Match case", wholeWord: "Match whole word", regexp: "Use regular expression", replaceOne: "Replace", replaceAll: "Replace all",
  count: "{current} of {total}", results: "{total} results", noResults: "No results",
  fold: "Fold", unfold: "Unfold", folded: "Folded code",
};

/** What the find widget shows, from the editor's search state. */
export type CodeSearchState = {
  open: boolean;
  search: string; replace: string; caseSensitive: boolean; wholeWord: boolean; regexp: boolean;
  /** The match the selection is on (1-based), 0 when it is on none. */
  current: number;
  total: number;
};
export const CLOSED_SEARCH: CodeSearchState = { open: false, search: "", replace: "", caseSensitive: false, wholeWord: false, regexp: false, current: 0, total: 0 };

/** The widget's count: "3 of 12", "12 results" when the selection is on none, "No results", or
 * nothing while the query is empty. */
export function searchCount(s: CodeSearchState, labels: CodeViewLabels): string {
  if (!s.search) return "";
  if (!s.total) return labels.noResults;
  const total = s.total.toLocaleString("en-US");
  return (s.current ? labels.count : labels.results).replace("{current}", String(s.current)).replace("{total}", total);
}

/* light syntax colouring — keywords / imports / conditionals, strings and numbers, function calls */
const KEYWORDS = new Set(["import", "from", "export", "default", "async", "function", "const", "let", "var", "await", "return", "if", "else", "for", "while", "new", "throw", "try", "catch", "null", "true", "false", "undefined"]);
const TOKEN = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`[^`]*`|\b\d+(?:\.\d+)?\b|\b(?:import|from|export|default|async|function|const|let|var|await|return|if|else|for|while|new|throw|try|catch|null|true|false|undefined)\b|[A-Za-z_$][\w$]*(?=\s*\())/g;

/** Split one line into plain runs and coloured tokens. Every target, and the editor, colour the same runs. */
export function tokenize(text: string): CodeToken[] {
  const out: CodeToken[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const idx = m.index ?? 0;
    const t = m[0];
    if (idx > last) out.push({ text: text.slice(last, idx) });
    out.push({ text: t, tok: /^["'`]/.test(t) || /^\d/.test(t) ? "str" : KEYWORDS.has(t) ? "kw" : "fn" });
    last = idx + t.length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

/** The rows of a value: one per line, as an editor counts them (an empty value is one empty line). */
export const linesOf = (value: string): string[] => value.split("\n");

/** While the code overflows its box, the body becomes a focusable, named scroll region so keyboard
 * users can scroll it; otherwise it is a plain container. */
export function watchOverflow(body: HTMLElement, label: string | undefined): () => void {
  const update = () => {
    const overflows = body.scrollHeight > body.clientHeight + 1 || body.scrollWidth > body.clientWidth + 1;
    if (overflows) {
      if (body.getAttribute("tabindex") !== "0") body.setAttribute("tabindex", "0");
      if (body.getAttribute("role") !== "region") body.setAttribute("role", "region");
      if (label && body.getAttribute("aria-label") !== label) body.setAttribute("aria-label", label);
      if (!label) body.removeAttribute("aria-label");
    } else {
      body.removeAttribute("tabindex");
      body.removeAttribute("role");
      body.removeAttribute("aria-label");
    }
  };
  update();
  if (typeof ResizeObserver === "undefined") return () => {};
  const ro = new ResizeObserver(update);
  ro.observe(body);
  if (body.firstElementChild) ro.observe(body.firstElementChild);
  return () => ro.disconnect();
}

/** Keep the current line in view: the listing scrolls (at once, it follows the caret) just enough
 * to show that row, a line's height clear of the edge; the page never scrolls. */
export function revealCurrentLine(root: HTMLElement | null): void {
  const body = root?.querySelector<HTMLElement>(":scope > [data-slot=code-view-body]");
  const row = body?.querySelector<HTMLElement>("[data-slot=code-view-row][aria-current=true]");
  if (!row || !body || !row.offsetParent || body.scrollHeight <= body.clientHeight) return;
  const b = body.getBoundingClientRect();
  const r = row.getBoundingClientRect();
  const margin = r.height;
  if (r.top < b.top + margin) body.scrollTop -= b.top + margin - r.top;
  else if (r.bottom > b.bottom - margin) body.scrollTop += r.bottom - (b.bottom - margin);
}

/** What the editor is given; `update` takes any of it again. */
export type CodeEditorOptions = {
  value: string;
  wrap: boolean;
  /** The line to put the caret on, when it is new (a jump from a list of problems). */
  currentLine?: number;
  label?: string;
  labels: CodeViewLabels;
  /** After an edit made in the editor, never after a value set through `update`. */
  onValueChange: (value: string) => void;
  /** When the caret moves to another line. */
  onCurrentLineChange: (line: number) => void;
  /** When the find widget opens, closes, or what it shows changes. */
  onSearch: (state: CodeSearchState) => void;
  /** Mod+F: the widget's field takes the focus (and selects its text). */
  onSearchFocus: () => void;
};
/** The find widget's actions, run by CodeMirror's own search commands. */
export type CodeSearchActions = {
  set(query: Partial<Pick<CodeSearchState, "search" | "replace" | "caseSensitive" | "wholeWord" | "regexp">>): void;
  next(): void; previous(): void; replace(): void; replaceAll(): void;
  /** Close the widget and give the focus back to the code. */
  close(): void;
  /** A key pressed in the widget, through the editor's search keys; true when one acted. */
  key(event: KeyboardEvent): boolean;
};
export type CodeEditorHandle = { update(options: Partial<CodeEditorOptions>): void; destroy(): void; search: CodeSearchActions };

/** Mount the editor in `parent` (the editor part). It is loaded on demand; until it is there, the
 * listing shows. Once created, it takes the listing's scroll position, then `onReady` tells the
 * adapter to drop the listing and show it. Updates sent before it arrives are kept for it. */
export function mountEditor(parent: HTMLElement, options: CodeEditorOptions, onReady: () => void): CodeEditorHandle {
  let current = options;
  let editor: CodeEditorHandle | undefined;
  let dead = false;
  void import("./code-view.editor").then(({ createCodeEditor }) => {
    if (dead) return;
    const root = parent.parentElement;
    const listing = root?.querySelector<HTMLElement>(":scope > [data-slot=code-view-body]");
    const icon = root?.querySelector<SVGElement>(":scope > [data-slot=code-view-icons] > svg") ?? null;
    editor = createCodeEditor(parent, current, { icon, scrollTop: listing?.scrollTop ?? 0, scrollLeft: listing?.scrollLeft ?? 0 });
    onReady();
  });
  return {
    update(next) { current = { ...current, ...next }; editor?.update(next); },
    destroy() { dead = true; editor?.destroy(); },
    search: {
      set: (q) => editor?.search.set(q),
      next: () => editor?.search.next(),
      previous: () => editor?.search.previous(),
      replace: () => editor?.search.replace(),
      replaceAll: () => editor?.search.replaceAll(),
      close: () => editor?.search.close(),
      key: (e) => editor?.search.key(e) ?? false,
    },
  };
}
