/* A code editor (VS Code, Zed): an activity bar and a side view (explorer or source control), open
 * files as attached tabs over the code, a terminal and problems panel below, an assistant on the
 * right, a command palette on Ctrl/⌘ K or P and a status bar. Dense like the product: 24px tree
 * and list rows, 28px tabs, 32px pane headers, 13px code that never wraps. Panels are a Splitter
 * (drag, or arrow keys on a handle); a panel is open while its size is above zero, so the toggles
 * and the handles share one state. Below 720px the app shows one view at a time, picked at the
 * bottom. Shortcuts are bound on the app's root, so they work while the app has focus and leave
 * the page's own keys alone.
 *
 * A rounded app: the page that hosts it has <html data-shape="rounded"> (index.json tells the
 * docs site), so no button, toggle or switcher here names a shape, and its dialogs follow. */
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { CheckCircle, Eye, File, FileText, Folder, GitBranch, MagnifyingGlass, Play, Sparkle, Terminal, Warning, XCircle } from "@phosphor-icons/react";
import {
  Button, CodeBlock, CommandPalette, Count, EmptyState, Kbd, ScrollArea, SegmentedControl, Splitter, Tabs, Toggle, TreeView,
  type CommandPaletteItem, type TreeViewNode,
} from "@fndn/react";
import { Assistant } from "./Assistant";
import { SourceControl } from "./SourceControl";
import { BRANCH, CHANGES, FILES, PROBLEMS, PROJECT, RATE_LIMIT_FIXED, TREE, lineDiff, testRun, type Change } from "./data";

const RATE_LIMIT = "src/middleware/rate-limit.ts";
/** An open diff is a tab of its own, next to the file's: its value is the path with this prefix. */
const DIFF = "diff:";
const mod = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl";
/** A pane's title row: 32px, the height of the tab strip beside it, quiet small text. */
const PANE_TITLE = "flex h-8 shrink-0 items-center px-3 text-xs font-medium text-ink-2";

/** The size of an element (a callback ref: the element may come and go), measured before the
 * first paint and on every change. */
function useSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const observer = useRef<ResizeObserver>(null);
  const ref = useCallback((el: HTMLElement | null) => {
    observer.current?.disconnect();
    if (!el) return;
    setSize({ width: el.clientWidth, height: el.clientHeight });
    observer.current = new ResizeObserver(([e]) => e && setSize({ width: e.contentRect.width, height: e.contentRect.height }));
    observer.current.observe(el);
  }, []);
  return [ref, size] as const;
}

const fileIcon = (path: string) => (path.endsWith(".md") ? <FileText data-slot="icon" /> : <File data-slot="icon" />);
const withIcons = (nodes: TreeViewNode[]): TreeViewNode[] =>
  nodes.map((n) => (n.children
    ? { ...n, icon: <Folder />, children: withIcons(n.children) }
    : { ...n, icon: n.value.endsWith(".md") ? <FileText /> : <File /> }));
const FILE_TREE = withIcons(TREE);
const nameOf = (path: string) => path.split("/").pop()!;
const pathOf = (tab: string) => (tab.startsWith(DIFF) ? tab.slice(DIFF.length) : tab);
const language = (path: string) => (path.endsWith(".ts") ? "TypeScript" : path.endsWith(".json") ? "JSON" : "Markdown");

/** A terminal line in vitest's colours: counts of failed red, passed green, marks in their tone;
 * what vitest dims (labels, a file's test count, timings, the path) is ink-2 beside the ink of
 * the output: two levels, and both are read, so neither is fainter than ink-2. PARTS also cuts
 * out the labels and a file's test count, so a "1 failed" inside "(3 tests | 1 failed)" is
 * dimmed with its count. */
const TONES: [RegExp, string][] = [
  [/^(\d+ failed|×|FAIL)$/, "text-red"],
  [/^(\d+ passed|✓)$/, "text-green"],
  [/^❯$/, "text-orange"],
  [/^(Test Files|Tests|Duration|RUN|\(\d+(?: tests?)?(?: \| \d+ failed)?\)|\d+ms|\/home\/[\w/-]+)$/, "text-ink-2"],
];
const PARTS = /(\d+ failed|\d+ passed|×|✓|❯|FAIL|Test Files|Tests|Duration|RUN|\(\d+(?: tests?)?(?: \| \d+ failed)?\)|\d+ms|\/home\/[\w/-]+)/;
function TerminalLine({ line }: { line: string }) {
  if (line.startsWith("$ ")) return <div className="ps-[1ch] text-ink">{line}</div>;
  if (!line) return <div>{" "}</div>;
  return (
    <div className="text-ink">
      {line.split(PARTS).map((part, i) => {
        const tone = TONES.find(([re]) => re.test(part))?.[1];
        return tone ? <span key={i} className={tone}>{part}</span> : part;
      })}
    </div>
  );
}

/** The terminal: opens at the start of the newest run (the first frame never scrolls), and a run
 * added later is brought in at its first line, once the terminal is in view (it may be a hidden
 * tab when the run is added). */
function TerminalOutput({ lines }: { lines: string[] }) {
  const output = useRef<HTMLPreElement>(null);
  const shown = useRef(lines.length);
  useLayoutEffect(() => {
    const el = output.current;
    const view = el?.closest<HTMLElement>("[data-slot=scroll-area-viewport]");
    if (!el || !view) return;
    const reveal = () => {
      const count = el.children.length;
      if (count === shown.current || !el.offsetHeight) return;
      shown.current = count;
      const rows = [...el.children] as HTMLElement[];
      const start = rows.map((row) => row.textContent?.startsWith("$ ")).lastIndexOf(true);
      view.scrollTop = start > 0 ? rows[start]!.offsetTop : 0;
    };
    reveal();
    const ro = new ResizeObserver(reveal);
    ro.observe(el);
    return () => ro.disconnect();
  }, [lines]);
  return (
    /* left to right on a right-to-left page too; long lines wrap at the pane's width, as a terminal
     * wraps at its columns, so a line's start is never cut and nothing scrolls sideways */
    <pre ref={output} className="relative px-3 py-2 font-mono text-xs leading-5 whitespace-pre-wrap wrap-anywhere [direction:ltr] [text-size-adjust:100%]">
      {lines.map((line, i) => <TerminalLine key={i} line={line} />)}
    </pre>
  );
}

/** One panel open: the sizes it takes, the others sharing the rest. */
const sideSizes = (side: boolean, assistant: boolean) => [side ? 23 : 0, 100 - (side ? 23 : 0) - (assistant ? 28 : 0), assistant ? 28 : 0];

export default function App() {
  const [root, { width }] = useSize();
  const phone = width > 0 && width < 720;

  /* the project */
  const [files, setFiles] = useState(FILES);
  const [changes, setChanges] = useState<Change[]>(CHANGES);
  const [problems, setProblems] = useState(PROBLEMS);
  const [terminal, setTerminal] = useState(() => testRun(false));
  const [passing, setPassing] = useState(false);
  const [ahead, setAhead] = useState(0);

  /* the editor: open tabs (a path, or DIFF + path) and the active one */
  const [open, setOpen] = useState([RATE_LIMIT, "test/rate-limit.test.ts", "src/routes/invoices.ts"]);
  const [active, setActive] = useState(RATE_LIMIT);
  const activePath = pathOf(active);
  const diffOf = active.startsWith(DIFF) ? activePath : null;
  /* the line the caret is on in each file, marked as the code block's current line */
  const [caret, setCaret] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState(["src", "src/middleware", "test"]);

  /* the layout */
  const [side, setSide] = useState<"explorer" | "changes">("explorer");
  const [sizes, setSizes] = useState(() => sideSizes(true, true));
  const [rows, setRows] = useState([68, 32]);
  const [panelTab, setPanelTab] = useState("terminal");
  const [phoneView, setPhoneView] = useState("code");
  const [palette, setPalette] = useState(false);
  const sideOpen = sizes[0]! > 0, assistantOpen = sizes[2]! > 0, panelOpen = rows[1]! > 0;

  const openTab = (tab: string) => {
    setOpen((o) => (o.includes(tab) ? o : [...o, tab]));
    setActive(tab);
    setPhoneView("code");
  };
  const openFile = (path: string, line?: number) => {
    openTab(path);
    if (line) setCaret((c) => ({ ...c, [path]: line }));
  };
  const openDiff = (path: string) => { openTab(DIFF + path); setSide("changes"); };
  const closeTab = (tab: string) => setOpen((o) => o.filter((t) => t !== tab));
  const showSide = (view: "explorer" | "changes" | null) => {
    if (view) setSide(view);
    setSizes(sideSizes(!!view, assistantOpen));
    if (view) setPhoneView(view === "explorer" ? "files" : "changes");
  };
  const showPanel = (show: boolean, tab?: string) => {
    if (tab) setPanelTab(tab);
    setRows(show ? [68, 32] : [100, 0]);
    if (show) setPhoneView("panel");
  };
  const runTests = (fixed = files[RATE_LIMIT] === RATE_LIMIT_FIXED) => {
    setTerminal((t) => [...t, "", ...testRun(fixed)]);
    setPassing(fixed);
    showPanel(true, "terminal");
  };
  const applyFix = (andTest: boolean) => {
    setFiles((f) => ({ ...f, [RATE_LIMIT]: RATE_LIMIT_FIXED }));
    /* appended, so the rows already there do not move */
    setChanges((c) => (c.some((x) => x.path === RATE_LIMIT) ? c : [...c, { path: RATE_LIMIT, status: "modified", before: FILES[RATE_LIMIT]! }]));
    setProblems((p) => p.filter((x) => x.fixedBy !== "rate-limit"));
    openDiff(RATE_LIMIT);
    if (andTest) runTests(true);
  };
  /* committed changes have no diff left: their tabs close, and the file's own tab takes over */
  const commit = () => {
    setChanges([]);
    setOpen((o) => { const kept = o.filter((t) => !t.startsWith(DIFF)); return diffOf && !kept.includes(diffOf) ? [...kept, diffOf] : kept; });
    if (diffOf) setActive(diffOf);
    setAhead((n) => n + 1);
  };

  /* files are found by name or path; commands show their own shortcut */
  const commands = useMemo((): CommandPaletteItem[] => [
    ...Object.keys(files).map((path) => ({
      value: `file:${path}`, label: nameOf(path), meta: path, group: "Files", keywords: [path],
      icon: path.endsWith(".md") ? <FileText data-slot="icon" weight="bold" /> : <File data-slot="icon" weight="bold" />,
    })),
    { value: "run-tests", label: "Run tests", meta: "pnpm test", group: "Commands", icon: <Play data-slot="icon" weight="bold" /> },
    { value: "explorer", label: "Show explorer", group: "View", shortcut: [mod, "B"], icon: <Eye data-slot="icon" weight="bold" /> },
    { value: "changes", label: "Show source control", group: "View", keywords: ["git", "diff"], icon: <GitBranch data-slot="icon" weight="bold" /> },
    { value: "terminal", label: "Show terminal", group: "View", shortcut: [mod, "J"], icon: <Terminal data-slot="icon" weight="bold" /> },
    { value: "problems", label: "Show problems", group: "View", keywords: ["errors", "warnings"], icon: <Warning data-slot="icon" weight="bold" /> },
    { value: "assistant", label: "Show assistant", group: "View", keywords: ["ai", "chat"], icon: <Sparkle data-slot="icon" weight="bold" /> },
  ], [files]);
  /* Quick Open's order: what was picked here first, then the open files (VS Code lists the
   * recently opened files before the rest of the workspace) */
  const [recent, setRecent] = useState<string[]>([]);
  const recentShown = [...new Set([...recent, ...open.filter((t) => !t.startsWith(DIFF)).map((t) => `file:${t}`)])].slice(0, 5);
  const run = (value: string) => {
    setRecent((r) => [value, ...r.filter((v) => v !== value)].slice(0, 3));
    if (value.startsWith("file:")) openFile(value.slice(5));
    else if (value === "run-tests") runTests();
    else if (value === "explorer" || value === "changes") showSide(value);
    else if (value === "terminal" || value === "problems") showPanel(true, value);
    else if (value === "assistant") { setSizes(sideSizes(sideOpen, true)); setPhoneView("assistant"); }
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === "k" || key === "p") { e.preventDefault(); e.stopPropagation(); setPalette(true); }
    else if (key === "j") { e.preventDefault(); showPanel(!panelOpen); }
    else if (key === "b") { e.preventDefault(); showSide(sideOpen ? null : side); }
  };

  /* ── the views ─────────────────────────────────────────── */

  /* the pane is titled by its view; the project is the tree's own label, as VS Code's section */
  const explorer = (
    <div className="flex h-full min-w-0 flex-col bg-canvas" data-editor="explorer">
      <div className={PANE_TITLE}>Explorer</div>
      <ScrollArea className="min-h-0 flex-1">
        <TreeView
          className="px-1 pb-2" size="xs" label={PROJECT} items={FILE_TREE}
          expandedValue={expanded} onExpandedValueChange={setExpanded}
          selectedValue={diffOf ? [] : [activePath]}
          onSelectedValueChange={(v) => v[0] && v[0] in files && openFile(v[0])}
        />
      </ScrollArea>
    </div>
  );

  const sourceControl = (
    <SourceControl changes={changes} selected={diffOf} branch={BRANCH} onSelect={openDiff} onCommit={commit} />
  );

  /* the editor: attached file tabs over the code block's editor body (no frame, no copy, no path;
   * lines never wrap and the gutter stays while the code scrolls sideways). The tabs are as wide
   * as their names, never cut (VS Code's): the strip scrolls when they do not fit */
  const editorOf = (tab: string) => {
    const path = pathOf(tab);
    if (tab.startsWith(DIFF)) {
      const change = changes.find((c) => c.path === path);
      return <CodeBlock editor variant="diff" filename={`${path} (working tree)`} diff={lineDiff(change?.before ?? files[path]!, files[path]!)} />;
    }
    return <CodeBlock editor filename={path} lines={files[path]} currentLine={caret[path]} />;
  };
  const code = (
    <div className="h-full bg-canvas" data-editor="code">
      {open.length ? (
        <Tabs
          variant="attached" size="sm" tabSizing="fit" closable fill aria-label="Open files"
          value={open.includes(active) ? active : open[0]} onValueChange={setActive} onClose={closeTab}
          items={open.map((tab) => ({
            value: tab,
            label: tab.startsWith(DIFF) ? `${nameOf(pathOf(tab))} (working tree)` : nameOf(tab),
            icon: tab.startsWith(DIFF) ? <GitBranch data-slot="icon" /> : fileIcon(tab),
            content: editorOf(tab),
          }))}
        />
      ) : (
        <EmptyState className="h-full bg-surface" size="block" icon="file" title="No open files" hint={`${mod}+P opens one by name.`} />
      )}
    </div>
  );

  const errors = problems.filter((p) => p.severity === "error").length;
  const warnings = problems.length - errors;
  const problemTree: TreeViewNode[] = [...new Set(problems.map((p) => p.path))].map((path) => ({
    value: path, label: nameOf(path), icon: <File />,
    children: problems.filter((p) => p.path === path).map((p) => ({
      value: p.value, label: `${p.message} [Ln ${p.line}, Col ${p.col}]`,
      icon: p.severity === "error" ? <XCircle weight="fill" className="text-red" /> : <Warning className="text-orange" />,
    })),
  }));
  const bottom = (
    <div className="h-full bg-surface" data-editor="panel">
      {/* fill: the panel under the strip takes the rest of the pane's height */}
      <Tabs
        fill variant="underline" inHeader headerClass="h-8 border-b border-line px-3 text-xs" aria-label="Panel"
        value={panelTab} onValueChange={setPanelTab}
        items={[
          {
            value: "terminal", label: "Terminal",
            content: (
              <ScrollArea className="h-full" data-editor="terminal">
                <TerminalOutput lines={terminal} />
              </ScrollArea>
            ),
          },
          {
            value: "problems",
            label: <span className="flex items-center gap-1.5">Problems <Count size="sm">{String(problems.length)}</Count></span>,
            content: (
              <ScrollArea className="h-full" data-editor="problems">
                {problems.length ? (
                  <TreeView
                    className="px-1 py-1" size="xs" aria-label="Problems" items={problemTree} expandedValue={problemTree.map((n) => n.value)}
                    selectedValue={[]}
                    onSelectedValueChange={(v) => { const p = problems.find((x) => x.value === v[0]); if (p) openFile(p.path, p.line); }}
                  />
                ) : (
                  <EmptyState size="row" title="No problems in the workspace" />
                )}
              </ScrollArea>
            ),
          },
        ]}
      />
    </div>
  );

  const assistant = <Assistant file={activePath} onApply={applyFix} onOpenDiff={openDiff} />;

  /* the system's command palette; Ctrl/⌘ K and P are bound on the app's root (onKeyDown), so they
   * work while the app has focus and leave the page's own ⌘K alone */
  const paletteDialog = (
    <CommandPalette
      items={commands} recent={recentShown} limit={8} hotkey={false}
      open={palette} onOpenChange={setPalette} onSelect={run}
      label="Go to a file or run a command" placeholder="Go to a file or run a command…"
      emptyTitle="Nothing matches" emptyHint="Try a file name, or a command such as Run tests."
    />
  );

  /* ── phone: one view at a time ──────────────────────────── */
  const views: Record<string, ReactNode> = { files: explorer, code, changes: sourceControl, panel: bottom, assistant };
  const phoneLayout = (
    <>
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-line ps-3 pe-1.5">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold" title={`${PROJECT} · ${BRANCH}`}>{PROJECT}</span>
        <Button variant="ghost" size="sm" square muted aria-label="Go to a file or run a command" icon={<MagnifyingGlass data-slot="icon" weight="bold" />} onClick={() => setPalette(true)} />
      </header>
      <div className="min-h-0 flex-1">{views[phoneView]}</div>
      <nav aria-label="Views" className="shrink-0 border-t border-line p-2">
        <SegmentedControl
          fill size="md" aria-label="View" value={phoneView} onValueChange={setPhoneView}
          options={[{ value: "files", label: "Files" }, { value: "code", label: "Code" }, { value: "changes", label: "Git" }, { value: "panel", label: "Terminal" }, { value: "assistant", label: "AI" }]}
        />
      </nav>
    </>
  );

  /* ── desktop ───────────────────────────────────────────── */
  const sideViews = [
    { value: "explorer" as const, label: `Explorer (${mod}+B)`, Icon: Folder },
    { value: "changes" as const, label: `Source control, ${changes.length === 1 ? "1 change" : `${changes.length} changes`}`, Icon: GitBranch },
  ];
  const desktopLayout = (
    <>
      {/* the title bar: the command center in the middle, the layout toggles at the end */}
      <header className="grid h-9 shrink-0 grid-cols-[1fr_minmax(0,18rem)_1fr] items-center gap-3 border-b border-line bg-canvas px-2">
        <span />
        <span className="relative flex">
          <Button variant="outline" size="sm" className="w-full justify-start pe-16 text-ink-3" icon={<MagnifyingGlass data-slot="icon" weight="bold" />} aria-keyshortcuts="Control+K Meta+K Control+P Meta+P" onClick={() => setPalette(true)} data-editor="palette-button">
            Go to file or command
          </Button>
          <span className="pointer-events-none absolute inset-y-0 end-1.5 flex items-center" aria-hidden><Kbd keys={[mod, "K"]} /></span>
        </span>
        <span className="flex justify-end gap-0.5">
          <Toggle variant="ink" size="sm" square tooltip={`Panel (${mod}+J)`} pressed={panelOpen} onPressedChange={(on) => showPanel(on)} icon={<Terminal data-slot="icon" weight="bold" />} />
          <Toggle variant="ink" size="sm" square tooltip="Assistant" pressed={assistantOpen} onPressedChange={(on) => setSizes(sideSizes(sideOpen, on))} icon={<Sparkle data-slot="icon" weight="bold" />} />
        </span>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* the activity bar: ink toggles with a bar at the inline start, never a grey box */}
        <nav aria-label="Side views" className="flex w-11 shrink-0 flex-col items-center gap-1 border-e border-line bg-canvas py-1.5">
          <div role="toolbar" aria-orientation="vertical" aria-label="Side view" className="flex flex-col items-center gap-1">
            {sideViews.map(({ value, label, Icon }) => (
              <Toggle
                key={value} data-value={value} variant="ink" indicator="start" size="md" square tooltip={label}
                pressed={sideOpen && side === value}
                onPressedChange={(on) => showSide(on ? value : null)}
                icon={<Icon data-slot="icon" weight="bold" />}
              />
            ))}
          </div>
        </nav>
        <Splitter
          className="min-w-0 flex-1" handleLabel="Resize the side views" size={sizes} onSizeChange={setSizes}
          panels={[
            { id: "side", minSize: 14, maxSize: 40, collapsible: true, content: sideOpen && (side === "explorer" ? explorer : sourceControl) },
            {
              id: "main", minSize: 30,
              content: (
                <Splitter
                  orientation="vertical" handleLabel="Resize the panel" size={rows} onSizeChange={setRows}
                  panels={[
                    { id: "editor", minSize: 30, content: code },
                    { id: "bottom", minSize: 15, collapsible: true, content: panelOpen && bottom },
                  ]}
                />
              ),
            },
            { id: "assistant", minSize: 22, maxSize: 45, collapsible: true, content: assistantOpen && assistant },
          ]}
        />
      </div>

      <footer className="flex h-6 shrink-0 items-center gap-3 border-t border-line bg-canvas px-2 text-xs text-ink-2" data-editor="status">
        <span className="flex items-center gap-1"><GitBranch weight="bold" aria-hidden />{BRANCH}{ahead > 0 && ` ↑${ahead}`}</span>
        <Button variant="ghost" size="xs" muted onClick={() => showPanel(true, "problems")} aria-label={`${errors} errors, ${warnings} warnings: show problems`}>
          <span className="flex items-center gap-1 tabular-nums"><XCircle weight="fill" className={errors ? "text-red" : undefined} aria-hidden />{errors}<Warning weight="bold" className="ms-1.5" aria-hidden />{warnings}</span>
        </Button>
        {/* the test result as VS Code's status bar shows it: ink text after a glyph in its tone (a
          * pill belongs in content); a press shows the run in the terminal */}
        <Button variant="ghost" size="xs" muted onClick={() => showPanel(true, "terminal")} aria-label={`${passing ? "Tests passing" : "1 test failing"}: show the terminal`}>
          <span className="flex items-center gap-1">
            {passing ? <CheckCircle weight="fill" className="text-green" aria-hidden /> : <XCircle weight="fill" className="text-red" aria-hidden />}
            {passing ? "Tests passing" : "1 test failing"}
          </span>
        </Button>
        <span className="ms-auto flex items-center gap-3">
          <span className="[unicode-bidi:plaintext]">{caret[activePath] ? `Ln ${caret[activePath]}` : `${(files[activePath] ?? []).length} lines`}</span>
          <span className="[unicode-bidi:plaintext]">Spaces: 2</span>
          <span>UTF-8</span>
          <span>{language(activePath)}</span>
        </span>
      </footer>
    </>
  );

  return (
    <div ref={root} tabIndex={-1} onKeyDown={onKeyDown} className="flex h-full flex-col bg-page text-ink outline-none" data-editor="root" data-layout={phone ? "phone" : "desktop"}>
      {phone ? phoneLayout : desktopLayout}
      {paletteDialog}
    </div>
  );
}
