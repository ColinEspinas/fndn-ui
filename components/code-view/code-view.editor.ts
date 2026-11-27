/* code-view's editor: CodeMirror 6, given the read-only listing's exact look. Loaded on demand by
 * code-view.logic.ts mountEditor, only for an editable view, so a listing never downloads it.
 *
 * Nothing of CodeMirror's own look is kept. The font, the 20px line and the text colour are
 * inherited from the view's root (the recipe sets them for the listing too); the insets, the gutter,
 * the current line, the selection and the caret come from the tokens. The colours of the code are
 * the listing's: the same tokenizer marks the same runs with the recipe's classes, so no language
 * package is needed. Folding follows indentation; the search panel is built from the system's
 * field and button recipes. */
import { Annotation, Compartment, EditorState, RangeSet, RangeSetBuilder, StateEffect, StateField, Transaction, type Extension } from "@codemirror/state";
import {
  Decoration, EditorView, GutterMarker, ViewPlugin, crosshairCursor, drawSelection, gutterLineClass, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers,
  rectangularSelection, runScopeHandlers, type BlockInfo, type DecorationSet, type ViewUpdate,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { SearchQuery, closeSearchPanel, findNext, findPrevious, getSearchQuery, openSearchPanel, replaceAll, replaceNext, search, searchKeymap, searchPanelOpen, setSearchQuery } from "@codemirror/search";
import { codeFolding, foldEffect, foldGutter, foldKeymap, foldService, foldable, foldedRanges, unfoldEffect } from "@codemirror/language";
import { codeView } from "./code-view.recipe";
import { tokenize, type CodeEditorHandle, type CodeEditorOptions, type CodeSearchState, type CodeViewLabels } from "./code-view.logic";

/* marks a change the host made (a new value, a jump to a line), so it is not reported back */
const fromHost = Annotation.define<boolean>();

const r = codeView();
const TOK = {
  kw: Decoration.mark({ class: r.tok({ tok: "kw" }) }),
  str: Decoration.mark({ class: r.tok({ tok: "str" }) }),
  fn: Decoration.mark({ class: r.tok({ tok: "fn" }) }),
};

/* the listing's colours, on the lines in view */
function tokenMarks(view: EditorView): DecorationSet {
  const out = new RangeSetBuilder<Decoration>();
  let last = 0;
  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to; ) {
      const line = view.state.doc.lineAt(pos);
      pos = line.to + 1;
      if (line.number <= last) continue;
      last = line.number;
      let at = line.from;
      for (const t of tokenize(line.text)) {
        if (t.tok) out.add(at, at + t.text.length, TOK[t.tok]);
        at += t.text.length;
      }
    }
  }
  return out.finish();
}
const tokens = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) { this.decorations = tokenMarks(view); }
    update(u: ViewUpdate) { if (u.docChanged || u.viewportChanged) this.decorations = tokenMarks(u.view); }
  },
  { decorations: (p) => p.decorations },
);

/* folding by indentation: a line folds the lines below it that are indented deeper (blank lines
 * inside count with them); the closing line, back at its indent, stays visible */
const indentOf = (text: string) => text.length - text.trimStart().length;
const byIndent = foldService.of((state, lineStart) => {
  const line = state.doc.lineAt(lineStart);
  if (!line.text.trim()) return null;
  const base = indentOf(line.text);
  let end = line;
  for (let n = line.number + 1; n <= state.doc.lines; n++) {
    const next = state.doc.line(n);
    if (!next.text.trim()) continue;
    if (indentOf(next.text) <= base) break;
    end = next;
  }
  return end.number > line.number ? { from: line.to, to: end.to } : null;
});

/* every colour is a token; the font and the line height are the root's */
const theme = EditorView.theme({
  "&": { color: "inherit", backgroundColor: "transparent", fontSize: "inherit" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "inherit", lineHeight: "inherit", overscrollBehaviorX: "contain" },
  ".cm-content": { paddingBlock: "12px", paddingInline: "0", caretColor: "var(--fndn-ink)" },
  ".cm-line": { paddingBlock: "0", paddingInline: "4px 12px" },
  ".cm-gutters": { backgroundColor: "var(--fndn-surface)", color: "var(--fndn-ink-3)", border: "none" },
  ".cm-lineNumbers .cm-gutterElement": {
    minWidth: "20px", paddingBlock: "0", paddingInline: "4px", borderInlineEnd: "1px solid var(--fndn-line)",
    fontSize: "var(--fndn-text-2xs)", fontVariantNumeric: "tabular-nums", textAlign: "end", userSelect: "none",
  },
  /* the fold marker takes no column: an 8px chevron over the gutter's hairline, inside the 4px on
   * each side of it, on the row's own fill so it covers the hairline where it sits */
  ".cm-foldGutter": { overflow: "visible" },
  ".cm-foldGutter .cm-gutterElement": { position: "relative", width: "0", minWidth: "0", paddingInline: "0", overflow: "visible" },
  ".cm-foldGutter [data-fold]": {
    position: "absolute", insetBlockStart: "0", insetInlineStart: "-4px", width: "8px", height: "20px",
    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
    color: "var(--fndn-ink-3)", backgroundColor: "var(--fndn-surface)",
  },
  ".cm-foldGutter [data-fold] svg": { width: "8px", height: "8px" },
  ".cm-foldGutter [data-fold=closed] svg": { transform: "rotate(-90deg)" },
  ".cm-lineNumbers .cm-gutterElement.cm-foldable": { cursor: "pointer" },
  /* an open marker shows while the pointer is over its line's number; a closed one always shows */
  "@media (hover: hover)": {
    ".cm-foldGutter .cm-gutterElement:not(.cm-hoverLine) [data-fold=open]": { visibility: "hidden" },
  },
  /* the current line: the caret's while the editor has the focus, else the host's currentLine.
   * CodeMirror marks the caret's line focused or not, and its own base theme tints it light blue:
   * unfocused, that line is plain */
  ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "transparent" },
  "&.cm-focused .cm-activeLine, &:not(.cm-focused) .cm-hostLine": { backgroundColor: "var(--fndn-hover)" },
  "&.cm-focused .cm-activeLineGutter, &:not(.cm-focused) .cm-gutterElement.cm-hostLine": { backgroundColor: "var(--fndn-hover)", color: "var(--fndn-ink)" },
  "&.cm-focused .cm-activeLineGutter [data-fold], &:not(.cm-focused) .cm-hostLine [data-fold]": { backgroundColor: "var(--fndn-hover)" },
  ".cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": { backgroundColor: "var(--fndn-accent-tint)" },
  ".cm-cursor, .cm-dropCursor": { borderInlineStart: "1.5px solid var(--fndn-ink)" },
  ".cm-foldPlaceholder": {
    backgroundColor: "var(--fndn-inset)", color: "var(--fndn-ink-2)", border: "none",
    borderRadius: "var(--fndn-radius-chip)", paddingInline: "4px", marginInline: "2px", cursor: "pointer",
  },
  ".cm-searchMatch": { backgroundColor: "var(--fndn-orange-tint)" },
  ".cm-searchMatch.cm-searchMatch-selected": { backgroundColor: "color-mix(in oklab, var(--fndn-orange) 35%, transparent)" },
  /* the find widget floats over the code (the adapters draw it): CodeMirror's panel stays empty, a
   * zero-height box. It is not display: none, which would give it a zero rectangle at the top of
   * the window, and CodeMirror would then scroll every match "clear" of it. */
  ".cm-panels, .cm-panels.cm-panels-top": { border: "none", backgroundColor: "transparent" },
});

/* the host's current line (tinted while the editor has no focus) and the line whose number the
 * pointer is over (its fold marker shows), both as line classes across the gutter */
const setHostLine = StateEffect.define<number | undefined>();
const setHoverLine = StateEffect.define<number | undefined>();
const lineField = (effect: typeof setHostLine) => StateField.define<number | undefined>({
  create: () => undefined,
  update(value, tr) {
    for (const e of tr.effects) if (e.is(effect)) value = e.value;
    return value;
  },
});
const hostLine = lineField(setHostLine);
const hoverLine = lineField(setHoverLine);
class LineClass extends GutterMarker {
  elementClass: string;
  constructor(name: string) { super(); this.elementClass = name; }
}
const HOST = new LineClass("cm-hostLine"), HOVER = new LineClass("cm-hoverLine"), FOLDABLE = new LineClass("cm-foldable");
const startOf = (state: EditorState, n: number | undefined) => (n !== undefined && n >= 1 && n <= state.doc.lines ? state.doc.line(n).from : undefined);
const lineMarks = [
  hostLine, hoverLine,
  gutterLineClass.compute([hostLine, hoverLine, "doc"], (state) => {
    const host = startOf(state, state.field(hostLine)), hover = startOf(state, state.field(hoverLine));
    const marks = [];
    if (host !== undefined) marks.push(HOST.range(host));
    if (hover !== undefined) {
      marks.push(HOVER.range(hover));
      const line = state.doc.lineAt(hover);
      if (foldable(state, line.from, line.to) || foldedAt(state, line.from, line.to)) marks.push(FOLDABLE.range(hover));
    }
    return RangeSet.of(marks, true);
  }),
  EditorView.decorations.compute([hostLine, "doc"], (state) => {
    const host = startOf(state, state.field(hostLine));
    return host === undefined ? Decoration.none : Decoration.set([Decoration.line({ class: "cm-hostLine" }).range(host)]);
  }),
  /* the pointer over a number shows its line's fold marker (the gutter is outside the content,
   * so this listens on the whole editor) */
  ViewPlugin.fromClass(class {
    view: EditorView;
    constructor(view: EditorView) {
      this.view = view;
      view.dom.addEventListener("mousemove", this.move);
      view.dom.addEventListener("mouseleave", this.leave);
    }
    set(n: number | undefined) { if (n !== this.view.state.field(hoverLine)) this.view.dispatch({ effects: setHoverLine.of(n) }); }
    move = (event: MouseEvent) => {
      const inGutter = (event.target as Element | null)?.closest?.(".cm-gutters");
      this.set(inGutter ? this.view.state.doc.lineAt(this.view.lineBlockAtHeight(event.clientY - this.view.documentTop).from).number : undefined);
    };
    leave = () => this.set(undefined);
    destroy() {
      this.view.dom.removeEventListener("mousemove", this.move);
      this.view.dom.removeEventListener("mouseleave", this.leave);
    }
  }),
];

/* a click on a foldable line's number folds it, or unfolds it */
function foldedAt(state: EditorState, from: number, to: number) {
  let found: { from: number; to: number } | undefined;
  foldedRanges(state).between(from, to, (a, b) => { if (!found && a >= from && a <= to) found = { from: a, to: b }; });
  return found;
}
function toggleFold(view: EditorView, line: BlockInfo) {
  const folded = foldedAt(view.state, line.from, line.to);
  if (folded) { view.dispatch({ effects: unfoldEffect.of(folded) }); return true; }
  const range = foldable(view.state, line.from, line.to);
  if (!range) return false;
  view.dispatch({ effects: foldEffect.of(range) });
  return true;
}

const phrases = (l: CodeViewLabels) => EditorState.phrases.of({
  "Fold line": l.fold, "Unfold line": l.unfold, "folded code": l.folded, unfold: l.unfold, close: l.close,
});
const named = (label: string | undefined) => EditorView.contentAttributes.of(label ? { "aria-label": label } : {});
const wrapping = (wrap: boolean) => (wrap ? EditorView.lineWrapping : []);

/* Find and replace: CodeMirror's search state, commands and keys, with the widget drawn by the
 * adapters over the code (the system's input, toggles, buttons and tooltips). CodeMirror only
 * marks the matches while its panel is open, so the panel is opened, empty and never shown. */
const emptyPanel = () => ({ dom: document.createElement("div") });
const MAX_COUNT = 9999;
function searchStateOf(state: EditorState): CodeSearchState {
  const q = getSearchQuery(state);
  const base = { search: q.search, replace: q.replace, caseSensitive: q.caseSensitive, wholeWord: q.wholeWord, regexp: q.regexp };
  if (!searchPanelOpen(state)) return { open: false, ...base, current: 0, total: 0 };
  let total = 0, current = 0;
  if (q.valid) {
    const main = state.selection.main;
    const cursor = q.getCursor(state) as Iterator<{ from: number; to: number }>;
    for (let m = cursor.next(); !m.done && total < MAX_COUNT; m = cursor.next()) {
      total++;
      if (m.value.from === main.from && m.value.to === main.to) current = total;
    }
  }
  return { open: true, ...base, current, total };
}

/* the smallest change from one text to another, so the selection maps through a value set from
 * outside instead of jumping to the start */
function change(from: string, to: string) {
  const max = Math.min(from.length, to.length);
  let start = 0;
  while (start < max && from.charCodeAt(start) === to.charCodeAt(start)) start++;
  let end = 0;
  while (end < max - start && from.charCodeAt(from.length - 1 - end) === to.charCodeAt(to.length - 1 - end)) end++;
  return { from: start, to: from.length - end, insert: to.slice(start, to.length - end) };
}

export function createCodeEditor(parent: HTMLElement, options: CodeEditorOptions, start: { icon: SVGElement | null; scrollTop: number; scrollLeft: number }): CodeEditorHandle {
  let opts = options;
  const wrapC = new Compartment(), labelC = new Compartment(), phraseC = new Compartment();
  const lineOf = (state: EditorState, n: number) => state.doc.line(Math.min(Math.max(1, Math.round(n)), state.doc.lines));
  /* the last line the host asked for, and the last one reported: the caret jumps only when the
   * host asks for a new line, so a host that keeps passing the same line never pulls it back */
  let asked = options.currentLine;
  let reported = 0;
  let lastSearch = "";
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const marker = (open: boolean) => {
    const span = document.createElement("span");
    span.dataset.fold = open ? "open" : "closed";
    if (start.icon) span.append(start.icon.cloneNode(true));
    return span;
  };
  const extensions: Extension[] = [
    lineNumbers({ domEventHandlers: { mousedown: (view, line) => toggleFold(view, line) } }),
    foldGutter({ markerDOM: marker }),
    lineMarks,
    codeFolding(),
    byIndent,
    highlightActiveLine(),
    highlightActiveLineGutter(),
    drawSelection({ cursorBlinkRate: reduced ? 0 : 1200 }),
    EditorState.allowMultipleSelections.of(true),
    rectangularSelection(),
    crosshairCursor(),
    history(),
    search({ top: true, createPanel: emptyPanel }),
    /* Mod+F opens find, or takes focus back to its field when it is open */
    keymap.of([{ key: "Mod-f", scope: "editor search-panel", preventDefault: true, run: (v) => { openSearchPanel(v); opts.onSearchFocus(); return true; } }]),
    keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap, ...searchKeymap, ...foldKeymap]),
    tokens,
    theme,
    wrapC.of(wrapping(options.wrap)),
    labelC.of(named(options.label)),
    phraseC.of(phrases(options.labels)),
    EditorView.updateListener.of((u) => {
      const own = u.transactions.some((tr) => !tr.annotation(fromHost));
      if (u.docChanged && u.transactions.some((tr) => tr.docChanged && !tr.annotation(fromHost))) opts.onValueChange(u.state.doc.toString());
      if (u.selectionSet || u.docChanged) {
        const n = u.state.doc.lineAt(u.state.selection.main.head).number;
        if (n !== reported) { reported = n; if (own) opts.onCurrentLineChange(n); }
      }
      /* what the find widget shows: open or not, the query, "3 of 12" */
      const open = searchPanelOpen(u.state);
      if (open || searchPanelOpen(u.startState)) {
        const next = searchStateOf(u.state);
        const key = JSON.stringify(next);
        if (key !== lastSearch) { lastSearch = key; opts.onSearch(next); }
      }
    }),
  ];
  const state = EditorState.create({ doc: options.value, extensions });
  const first = lineOf(state, options.currentLine ?? 1);
  reported = first.number;
  const view = new EditorView({ state: state.update({ selection: { anchor: first.from }, effects: setHostLine.of(options.hostLine) }).state, parent });
  view.scrollDOM.scrollTop = start.scrollTop;
  view.scrollDOM.scrollLeft = start.scrollLeft;

  return {
    update(next) {
      const prev = opts;
      opts = { ...opts, ...next };
      const effects = [];
      if (next.wrap !== undefined && next.wrap !== prev.wrap) effects.push(wrapC.reconfigure(wrapping(next.wrap)));
      if ("label" in next && next.label !== prev.label) effects.push(labelC.reconfigure(named(next.label)));
      if (next.labels && JSON.stringify(next.labels) !== JSON.stringify(prev.labels)) effects.push(phraseC.reconfigure(phrases(next.labels)));
      if ("hostLine" in next && next.hostLine !== view.state.field(hostLine)) effects.push(setHostLine.of(next.hostLine));
      const doc = view.state.doc.toString();
      const changes = next.value !== undefined && next.value !== doc ? change(doc, next.value) : undefined;
      let selection: { anchor: number } | undefined;
      if ("currentLine" in next && next.currentLine !== asked) {
        asked = next.currentLine;
        if (asked !== undefined) {
          const after = changes ? view.state.update({ changes }).state : view.state;
          const target = lineOf(after, asked);
          if (after.doc.lineAt(after.selection.main.head).number !== target.number) {
            selection = { anchor: target.from };
            effects.push(EditorView.scrollIntoView(target.from, { y: "nearest", yMargin: 20 }));
          }
        }
      }
      if (!changes && !selection && !effects.length) return;
      view.dispatch({ changes, selection, effects, annotations: [fromHost.of(true), Transaction.addToHistory.of(false)] });
    },
    search: {
      set(query) {
        const q = getSearchQuery(view.state);
        const next = new SearchQuery({ search: q.search, replace: q.replace, caseSensitive: q.caseSensitive, wholeWord: q.wholeWord, regexp: q.regexp, ...query });
        if (!next.eq(q)) view.dispatch({ effects: setSearchQuery.of(next) });
      },
      next() { findNext(view); },
      previous() { findPrevious(view); },
      replace() { replaceNext(view); },
      replaceAll() { replaceAll(view); },
      close() { closeSearchPanel(view); view.focus(); },
      /* the widget's keys go through CodeMirror's search keymap (F3, Mod+G, Escape, Mod+F) */
      key(event) {
        const done = runScopeHandlers(view, event, "search-panel");
        if (done && !searchPanelOpen(view.state)) view.focus();
        return done;
      },
    },
    destroy() { view.destroy(); },
  };
}
