/* A browser window: tabs that open, close and load; back, forward and reload; an address bar with
 * suggestions; bookmarks; downloads; a main menu; History and Settings pages. All state lives here,
 * the pieces are in toolbar.tsx and pages.tsx.
 *
 * Keyboard: Ctrl/⌘+L focuses the address bar. A real browser keeps Ctrl/⌘+T, W and Tab for itself,
 * so the window also answers to Alt+T (new tab), Alt+W (close), Alt+Shift+T (reopen), Alt+1…9
 * (switch), Alt+Y (history); Ctrl+T, W and Tab still work where the host lets them through.
 * In the tab strip, arrows move between tabs and Delete closes the focused one (the Tabs' own).
 *
 * The layout: closable pill tabs in a header row over the toolbar, the bookmarks bar and the page.
 * The first icon of every row (a tab's favicon, Back, the first bookmark) stands on one line, 14px
 * from the window's edge. On a phone no strip: a tab-count button opens the open tabs as a sheet. */
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Progress, ScrollArea, Spinner, Tabs, Tooltip, Button } from "@fndn/react";
import { Plus } from "@phosphor-icons/react";
import { BOOKMARKS, CLI_DOWNLOAD, ENGINES, HISTORY, HOME, SETTINGS, VISITS, resolve, siteOf, type Visit } from "./data";
import { Favicon, Page, type Settings } from "./pages";
import { AddressBar, BookmarksBar, BrowserMenu, Downloads, NavButtons, TabSwitcher, suggestionsFor, useDownloads } from "./toolbar";

type Tab = {
  id: string;
  /** The tab's own history: back and forward move `at` along it. */
  stack: string[];
  at: number;
  loading: boolean;
  /** The page on screen: the previous one stays until the next has loaded. */
  page: string;
};

const urlOf = (tab: Tab) => tab.stack[tab.at] ?? HOME;
const now = () => new Date().toTimeString().slice(0, 5);
let seq = 3;

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "t1", stack: ["harbor.dev/docs/getting-started"], at: 0, loading: false, page: "harbor.dev/docs/getting-started" },
    { id: "t2", stack: ["status.harbor.dev"], at: 0, loading: false, page: "status.harbor.dev" },
    { id: "t3", stack: ["fieldnotes.app/northwind/q4-planning"], at: 0, loading: false, page: "fieldnotes.app/northwind/q4-planning" },
  ]);
  const [active, setActive] = useState("t1");
  const [closed, setClosed] = useState<Tab[]>([]);
  const [settings, setSettings] = useState<Settings>({ bookmarksBar: true, askWhereToSave: false, zoom: "100%", engine: ENGINES[0]!.value });
  const [bookmarks, setBookmarks] = useState(BOOKMARKS);
  const [visits, setVisits] = useState<Visit[]>(VISITS);
  const [downloads, setDownloads] = useDownloads();
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const tab = tabs.find((t) => t.id === active) ?? tabs[0]!;
  const url = urlOf(tab);
  const set = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));
  const update = (id: string, change: (t: Tab) => Tab) => setTabs((all) => all.map((t) => (t.id === id ? change(t) : t)));

  /* a site "loads" for a moment (a spinner in its tab, a progress bar over the page; the previous
   * page stays until then); the browser's own pages (ui://) show at once */
  const local = (u: string) => u.startsWith("ui://");
  const load = (id: string, to: string) => {
    clearTimeout(timers.current.get(id));
    if (local(to)) return update(id, (t) => ({ ...t, loading: false, page: to }));
    update(id, (t) => ({ ...t, loading: true }));
    timers.current.set(id, setTimeout(() => update(id, (t) => ({ ...t, loading: false, page: urlOf(t) })), 450 + Math.random() * 500));
  };
  const navigate = (text: string) => {
    const to = resolve(text, settings.engine);
    update(tab.id, (t) => ({ ...t, stack: [...t.stack.slice(0, t.at + 1), to], at: t.at + 1 }));
    if (!local(to)) setVisits((v) => [{ url: to, time: now(), day: "today" }, ...v]);
    load(tab.id, to);
  };
  const step = (by: number) => {
    const at = Math.max(0, Math.min(tab.stack.length - 1, tab.at + by));
    update(tab.id, (t) => ({ ...t, at }));
    load(tab.id, tab.stack[at] ?? HOME);
  };
  const reload = () => load(tab.id, url);
  const stop = () => { clearTimeout(timers.current.get(tab.id)); update(tab.id, (t) => ({ ...t, loading: false, page: urlOf(t) })); };

  /* the address bar takes focus after the panel that holds it has rendered */
  const [focusTick, setFocusTick] = useState(0);
  const focusAddress = () => setFocusTick((n) => n + 1);
  useEffect(() => {
    if (!focusTick) return;
    const input = root.current?.querySelector<HTMLInputElement>("[data-slot=tabs-content]:not([hidden]) [data-slot=combobox-input]");
    input?.focus();
    input?.select();
  }, [focusTick]);

  /* a shortcut or Delete that removes the focused panel or tab hands focus to the window, so the
   * next shortcut still reaches it */
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (document.activeElement === document.body) root.current?.focus({ preventScroll: true });
  }, [tab.id, tabs.length]);

  const open = (to = HOME) => {
    const id = `t${++seq}`;
    setTabs((all) => [...all, { id, stack: [to], at: 0, loading: false, page: "" }]);
    setActive(id);
    load(id, to);
    if (to === HOME) focusAddress();
  };
  /* closing the last tab leaves a new tab page, as a window that stays open would. The Tabs have
   * already selected the neighbour (onValueChange) when they ask to close */
  const close = (id: string) => {
    const i = tabs.findIndex((t) => t.id === id);
    const gone = tabs[i];
    if (!gone) return;
    setClosed((c) => [gone, ...c]);
    const rest = tabs.filter((t) => t.id !== id);
    if (rest.length === 0) {
      const fresh = { id: `t${++seq}`, stack: [HOME], at: 0, loading: false, page: HOME };
      setTabs([fresh]);
      setActive(fresh.id);
      return;
    }
    setTabs(rest);
    if (id === active) setActive((rest[i] ?? rest[i - 1])!.id);
  };
  const reopen = (id = closed[0]?.id) => {
    const t = closed.find((c) => c.id === id);
    if (!t) return;
    setClosed((c) => c.filter((x) => x.id !== id));
    setTabs((all) => [...all, { ...t, page: "" }]);
    setActive(t.id);
    load(t.id, urlOf(t));
  };
  /* the browser's own pages open once: a second request switches to the open tab */
  const openPage = (to: string) => {
    const there = tabs.find((t) => urlOf(t) === to);
    if (there) setActive(there.id); else open(to);
  };

  const menu = (value: string) => {
    if (value === "new-tab") open();
    else if (value === "reopen") reopen();
    else if (value === "history") openPage(HISTORY);
    else if (value === "settings") openPage(SETTINGS);
    else if (value === "downloads") setDownloadsOpen(true);
    else if (value.startsWith("closed:")) reopen(value.slice(7));
    else if (value.startsWith("open:")) navigate(value.slice(5));
  };

  const shortcuts = (e: KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey;
    const alt = e.altKey && !mod;
    const key = e.code;
    const run = (action: () => void) => { e.preventDefault(); action(); };
    if (mod && key === "KeyL") return run(focusAddress);
    if ((alt || mod) && !e.shiftKey && key === "KeyT") return run(() => open());
    if (alt && e.shiftKey && key === "KeyT") return run(() => reopen());
    if ((alt || mod) && key === "KeyW") return run(() => close(tab.id));
    if (alt && key === "KeyY") return run(() => openPage(HISTORY));
    if (alt && key === "KeyJ") return run(() => setDownloadsOpen(true));
    const digit = /^Digit[1-9]$/.test(key) ? Number(key.slice(5)) : /^[1-9]$/.test(e.key) ? Number(e.key) : 0;
    if (alt && digit) {
      const to = digit === 9 ? tabs[tabs.length - 1] : tabs[digit - 1];
      return to && run(() => setActive(to.id));
    }
    if (e.ctrlKey && key === "Tab") {
      const i = tabs.findIndex((t) => t.id === tab.id);
      return run(() => setActive(tabs[(i + (e.shiftKey ? -1 : 1) + tabs.length) % tabs.length]!.id));
    }
  };
  /* a middle click closes a tab, as in every browser */
  const auxClose = (e: MouseEvent) => {
    const trigger = (e.target as HTMLElement).closest<HTMLElement>("[data-slot=tabs-trigger]");
    if (e.button === 1 && trigger?.dataset.value) { e.preventDefault(); close(trigger.dataset.value); }
  };
  /* the Download link on the Getting started page: the toolbar's ring shows it arriving */
  const download = () => setDownloads((l) => [{ id: `dl${++seq}`, received: 0, ...CLI_DOWNLOAD }, ...l]);

  const site = siteOf(url);
  const bookmarked = bookmarks.some((b) => b.url === url);
  const zoom = parseInt(settings.zoom, 10) / 100;

  const tabInfo = tabs.map((t) => ({ id: t.id, url: urlOf(t), loading: t.loading }));
  /* the toolbar, the bookmarks bar and the page: the selected tab's panel, under the strip's line */
  const body = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-0.5 px-2 py-1.5">
        <NavButtons canBack={tab.at > 0} canForward={tab.at < tab.stack.length - 1} loading={tab.loading} back={() => step(-1)} forward={() => step(1)} reload={reload} stop={stop} />
        <AddressBar
          url={url} secure={site.secure} bookmarked={bookmarked} go={navigate} suggestions={suggestionsFor(url, visits)} engine={settings.engine}
          onBookmark={(on) => setBookmarks((b) => (on ? [...b, { url, label: site.title.split(/ [·—:] /)[0]! }] : b.filter((x) => x.url !== url)))}
        />
        <Downloads list={downloads} open={downloadsOpen} onOpenChange={setDownloadsOpen}
          onCancel={(id) => setDownloads((l) => l.filter((d) => d.id !== id))} onClear={() => setDownloads((l) => l.filter((d) => d.received < d.size))} />
        <TabSwitcher tabs={tabInfo} active={tab.id} open={switcherOpen} onOpenChange={setSwitcherOpen}
          select={(id) => { setActive(id); setSwitcherOpen(false); }} close={close} newTab={() => { setSwitcherOpen(false); open(); }} />
        <BrowserMenu closed={closed.map((t) => ({ id: t.id, url: urlOf(t) }))} bookmarks={bookmarks} bookmarksBar={settings.bookmarksBar} zoom={settings.zoom}
          onSelect={menu} onBookmarksBar={(on) => set({ bookmarksBar: on })} onZoom={(z) => set({ zoom: z })} />
      </div>
      {/* shown or hidden, the bar opens or closes its row (instant from the keyboard) */}
      <div className={`grid kbd-instant motion-size-reveal max-sm:hidden ${settings.bookmarksBar ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="min-h-0 overflow-hidden"><BookmarksBar bookmarks={bookmarks} go={navigate} /></div>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col border-t border-line">
        {tab.loading && <Progress className="absolute inset-x-0 top-0 z-1" size="sm" tone="accent" ariaLabel={`Loading ${site.title}`} />}
        <ScrollArea key={tab.page} className="min-h-0 flex-1" aria-label={siteOf(tab.page).title}>
          <div style={{ zoom }}>
            {tab.page && <Page url={tab.page} go={navigate} reload={reload} download={download} settings={settings} set={set} visits={visits} clearHistory={() => setVisits([])} />}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  return (
    <div ref={root} data-showcase="web-browser" tabIndex={-1} onKeyDown={shortcuts} onAuxClick={auxClose} className="flex h-full flex-col overflow-hidden bg-surface outline-none">
      <Tabs
        variant="pill"
        closable
        fill
        inHeader
        aria-label="Tabs"
        value={tab.id}
        onValueChange={setActive}
        onClose={close}
        closeLabel="Close tab"
        /* a phone shows no strip: the tab-count button in the toolbar opens the tabs as a sheet. The
         * header's 6px start inset puts the first favicon 14px from the edge, as Back and the first
         * bookmark */
        headerClass="h-9 gap-0.5 border-b border-line ps-1.5 pe-2 max-sm:hidden"
        end={
          <Tooltip content="New tab" shortcut="Alt+T">
            <Button variant="ghost" size="sm" square muted aria-label="New tab" icon={<Plus data-slot="icon" weight="bold" />} onClick={() => open()} className="shrink-0" />
          </Tooltip>
        }
        items={tabs.map((t) => ({
          value: t.id,
          label: siteOf(urlOf(t)).title,
          icon: t.loading ? <Spinner decorative /> : <Favicon url={urlOf(t)} />,
          content: t.id === tab.id ? body : null,
        }))}
      />
    </div>
  );
}
