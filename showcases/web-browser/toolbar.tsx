/* The browser's chrome under the tab strip: navigation buttons, the address bar (site information,
 * suggestions, bookmark star), downloads, the main menu, and the bookmarks bar. */
import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  Button, Combobox, Drawer, Menu, Popover, Progress, ProgressRing, Separator, Toggle, Tooltip, type MenuEntry,
} from "@fndn/react";
import {
  ArrowClockwise, ArrowLeft, ArrowRight, BookmarkSimple, Browsers, ClockCounterClockwise, DotsThreeVertical, DownloadSimple,
  File, FilePdf, FolderOpen, Gear, Globe, Lock, MagnifyingGlass, Package, Plus, Star, Warning, X,
} from "@phosphor-icons/react";
import { DOWNLOADS, ENGINES, HOME, READING, SITES, resolve, searchQuery, siteOf, type Bookmark, type Download, type Visit } from "./data";
import { Favicon } from "./pages";

/** A square icon button with its name in a tooltip. */
export function IconButton({ label, shortcut, icon, ...rest }: { label: string; shortcut?: string; icon: ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return (
    <Tooltip content={label} shortcut={shortcut}>
      <Button variant="ghost" size="sm" square muted aria-label={label} icon={icon} {...rest} />
    </Tooltip>
  );
}

/** The site information button at the start of the address bar: a lock, a warning, or the browser's
 * own mark on its pages. Always there, so the address never moves when the page changes. */
function SiteInfo({ url, secure }: { url: string; secure: boolean }) {
  const internal = url.startsWith("ui://");
  const Glyph = internal ? Browsers : secure ? Lock : Warning;
  const [label, text] = internal
    ? ["This is a browser page", "Settings, history and the new tab page belong to the browser, not to a website."]
    : secure
      ? ["Connection is secure", "Your information, like passwords or card numbers, is private when it is sent to this site."]
      : ["Not secure", "Don’t enter passwords or card numbers on this site: they could be read by others on the network."];
  return (
    <Popover
      title={internal ? "Browser" : url.split("/")[0]}
      placement="bottom-start"
      trigger={<Button variant="ghost" size="xs" shape="rounded" square muted aria-label="View site information" icon={<Glyph data-slot="icon" weight="bold" />} />}
    >
      <div className="flex w-[260px] max-w-full flex-col gap-2 text-sm text-ink-2">
        <span className="flex items-center gap-2 text-ink"><Glyph data-slot="icon" weight="bold" />{label}</span>
        <p>{text}</p>
      </div>
    </Popover>
  );
}

/** The suggestions for what was typed, Chrome's order: pages whose address starts with it (Enter
 * goes there), then a search for it, then pages that merely contain it (in the address or the
 * title). With nothing typed, every page. Each row leads with what it is (the site's favicon, a
 * globe for an address not visited yet, a magnifier for the search), and the typed part of the
 * address stays in ink while the rest dims (highlightMatch). */
function suggestionItems(typed: string, pages: string[], engine: string) {
  const row = (u: string) => {
    const title = siteOf(u).title;
    return { value: u, label: u, icon: <Favicon url={u} size={14} />, meta: title === u ? undefined : title, keywords: [title] };
  };
  const q = typed.trim();
  if (!q) return pages.map(row);
  const lower = q.toLowerCase();
  const prefix = pages.filter((u) => u.toLowerCase().startsWith(lower));
  const typedUrl = resolve(q, engine);
  const domain = !searchQuery(typedUrl) && !pages.includes(typedUrl) ? [{ value: typedUrl, label: typedUrl, icon: <Globe data-slot="icon" weight="bold" />, keywords: [q] }] : [];
  const name = ENGINES.find((e) => e.value === engine)?.label ?? ENGINES[0]!.label;
  const search = { value: `search:${q}`, label: `Search ${name} for “${q}”`, icon: <MagnifyingGlass data-slot="icon" weight="bold" />, keywords: [q] };
  return [...prefix.map(row), ...domain, search, ...pages.filter((u) => !prefix.includes(u)).map(row)];
}

export function AddressBar({ url, secure, bookmarked, onBookmark, suggestions, go, engine }: {
  url: string; secure: boolean; bookmarked: boolean; onBookmark: (on: boolean) => void; suggestions: string[]; go: (text: string) => void; engine: string;
}) {
  /* what the user typed (not the label a selection writes into the field) */
  const [typed, setTyped] = useState("");
  const items = suggestionItems(typed, suggestions, engine);
  const choose = (v: string | null) => {
    setTyped("");
    if (!v) return;
    const prefix = ENGINES.find((e) => e.value === engine)?.prefix ?? ENGINES[0]!.prefix;
    go(v.startsWith("search:") ? prefix + encodeURIComponent(v.slice(7)) : v);
  };
  /* Enter with no row highlighted (the list closed): go to the text, or search for it */
  const enter = (e: KeyboardEvent) => {
    const input = e.target as HTMLInputElement;
    if (e.key !== "Enter" || input.tagName !== "INPUT" || !input.value.trim()) return;
    if (!document.querySelector("[data-slot=combobox-content][data-state=open] [data-slot=combobox-item][data-highlighted]")) { setTyped(""); go(input.value); }
  };
  const internal = url.startsWith("ui://");
  return (
    <div className="flex min-w-0 flex-1" onKeyDown={enter} onInput={(e) => setTyped((e.target as HTMLInputElement).value)}>
      <Combobox
        className="min-w-0 flex-1"
        size="sm"
        variant="subtle"
        caret={false}
        highlightMatch
        aria-label="Address and search bar"
        placeholder="Search or type a URL"
        items={items}
        value={url === HOME ? null : url}
        onValueChange={choose}
        onOpenChange={(open) => { if (!open) setTyped(""); }}
        start={url === HOME
          ? <span className="grid size-6 place-items-center"><MagnifyingGlass data-slot="icon" weight="bold" aria-hidden /></span>
          : <SiteInfo url={url} secure={secure} />}
        end={!internal && (
          <Toggle variant="ink" size="xs" shape="rounded" square className="aria-pressed:text-accent" tooltip={bookmarked ? "Remove bookmark" : "Bookmark this tab"}
            pressed={bookmarked} onPressedChange={onBookmark} icon={<Star data-slot="icon" weight={bookmarked ? "fill" : "bold"} />} />
        )}
      />
    </div>
  );
}

const ICON = { pdf: FilePdf, archive: Package, file: File };
const mb = (n: number) => (n < 1 ? `${Math.round(n * 1000)} KB` : `${n.toFixed(1)} MB`);

/** Downloads keep receiving while the window is open: STEP megabytes every half second. */
const STEP = 0.5;
export function useDownloads() {
  const [list, setList] = useState<Download[]>(DOWNLOADS);
  const active = list.some((d) => d.received < d.size);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setList((all) => all.map((d) => (d.received < d.size ? { ...d, received: Math.min(d.size, d.received + STEP) } : d))), 500);
    return () => clearInterval(timer);
  }, [active]);
  return [list, setList] as const;
}

export function Downloads({ list, onCancel, onClear, open, onOpenChange }: {
  list: Download[]; onCancel: (id: string) => void; onClear: () => void; open: boolean; onOpenChange: (open: boolean) => void;
}) {
  const running = list.find((d) => d.received < d.size);
  const icon = running
    ? <ProgressRing size="sm" tone="accent" progress={running.received / running.size} label={`Downloading ${running.name}`}><DownloadSimple data-slot="icon" weight="bold" /></ProgressRing>
    : <DownloadSimple data-slot="icon" weight="bold" />;
  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
      title="Downloads"
      placement="bottom-end"
      trigger={<Tooltip content="Downloads"><Button variant="ghost" size="sm" square muted aria-label="Downloads" icon={icon} /></Tooltip>}
    >
      <div className="flex w-[300px] max-w-full flex-col gap-3">
        {list.length === 0 && <p className="text-sm text-ink-2">Files you download appear here.</p>}
        {list.map((d) => {
          const Glyph = ICON[d.kind];
          const done = d.received >= d.size;
          return (
            <div key={d.id} className="flex items-start gap-3">
              <Glyph className="mt-0.5 size-5 shrink-0 text-ink-3" weight="bold" aria-hidden />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-sm text-ink [overflow-wrap:anywhere]">{d.name}</span>
                {!done && <Progress size="sm" tone="accent" value={d.received} max={d.size} ariaLabel={`Downloading ${d.name}`} />}
                <span className="text-xs text-ink-2 tabular-nums">
                  {done ? `${mb(d.size)} · Done` : `${mb(d.received)} of ${mb(d.size)} · ${Math.ceil(((d.size - d.received) / STEP) * 0.5)} s left`}
                </span>
              </div>
              {done
                ? <IconButton label="Show in folder" icon={<FolderOpen data-slot="icon" weight="bold" />} />
                : <IconButton label="Cancel download" icon={<X data-slot="icon" weight="bold" />} onClick={() => onCancel(d.id)} />}
            </div>
          );
        })}
        {list.length > 0 && <Button size="sm" variant="outline" className="self-start" onClick={onClear}>Clear list</Button>}
      </div>
    </Popover>
  );
}

export function BrowserMenu({ closed, bookmarks, bookmarksBar, zoom, onSelect, onBookmarksBar, onZoom }: {
  closed: { id: string; url: string }[]; bookmarks: Bookmark[]; bookmarksBar: boolean; zoom: string;
  onSelect: (value: string) => void; onBookmarksBar: (on: boolean) => void; onZoom: (zoom: string) => void;
}) {
  const items: MenuEntry[] = [
    { value: "new-tab", label: "New tab", meta: "Alt+T", icon: <Plus data-slot="icon" weight="bold" /> },
    { value: "reopen", label: "Reopen closed tab", meta: "Alt+Shift+T", disabled: closed.length === 0 },
    { type: "separator" },
    {
      type: "submenu", label: "History", icon: <ClockCounterClockwise data-slot="icon" weight="bold" />, items: [
        { value: "history", label: "Show full history", meta: "Alt+Y" },
        { type: "separator" },
        {
          type: "group", label: "Recently closed",
          items: closed.length ? closed.slice(0, 5).map((t) => ({ value: `closed:${t.id}`, label: siteOf(t.url).title })) : [{ value: "none", label: "No closed tabs", disabled: true }],
        },
      ],
    },
    { value: "downloads", label: "Downloads", meta: "Alt+J", icon: <DownloadSimple data-slot="icon" weight="bold" /> },
    {
      type: "submenu", label: "Bookmarks", icon: <BookmarkSimple data-slot="icon" weight="bold" />, items: [
        { type: "checkbox", value: "bookmarks-bar", label: "Show bookmarks bar", checked: bookmarksBar },
        { type: "separator" },
        ...bookmarks.map((b) => ({ value: `open:${b.url}`, label: b.label })),
      ],
    },
    { type: "separator" },
    { type: "radio-group", name: "zoom", label: "Zoom", value: zoom, items: ["90%", "100%", "125%"].map((v) => ({ value: v, label: v })) },
    { type: "separator" },
    { value: "settings", label: "Settings", icon: <Gear data-slot="icon" weight="bold" /> },
  ];
  return (
    <Menu items={items} placement="bottom-end" onSelect={onSelect} onCheckedChange={(_, on) => onBookmarksBar(on)} onRadioChange={(_, v) => onZoom(v)}>
      <Tooltip content="Customize and control">
        <Button variant="ghost" size="sm" square muted aria-label="Main menu" icon={<DotsThreeVertical data-slot="icon" weight="bold" />} />
      </Tooltip>
    </Menu>
  );
}

/** The bookmarks under the address bar, and the Reading list folder. The row keeps 4px above and
 * below the buttons: it scrolls sideways (and sits in a clipped reveal), so the focus ring
 * (2px at a 2px offset) must fit inside it. */
export function BookmarksBar({ bookmarks, go }: { bookmarks: Bookmark[]; go: (url: string) => void }) {
  return (
    <nav aria-label="Bookmarks" className="flex min-w-0 items-center gap-0.5 overflow-x-auto overscroll-x-contain px-2 py-1 [scrollbar-width:none]">
      {bookmarks.map((b) => (
        <Button key={b.url} variant="ghost" size="xs" icon={<Favicon url={b.url} />} onClick={() => go(b.url)} className="shrink-0">{b.label}</Button>
      ))}
      <Separator orientation="vertical" decorative className="mx-1 h-4" />
      <Menu items={READING.map((b) => ({ value: b.url, label: b.label }))} onSelect={go}>
        <Button variant="ghost" size="xs" className="shrink-0" icon={<FolderOpen data-slot="icon" weight="bold" />}>Reading list</Button>
      </Menu>
    </nav>
  );
}

export function NavButtons({ canBack, canForward, loading, back, forward, reload, stop }: {
  canBack: boolean; canForward: boolean; loading: boolean; back: () => void; forward: () => void; reload: () => void; stop: () => void;
}) {
  return (
    <>
      <IconButton label="Back" icon={<ArrowLeft data-slot="icon" weight="bold" />} onClick={back} disabled={!canBack} />
      <IconButton label="Forward" icon={<ArrowRight data-slot="icon" weight="bold" />} onClick={forward} disabled={!canForward} className="max-sm:hidden" />
      {loading
        ? <IconButton label="Stop loading" icon={<X data-slot="icon" weight="bold" />} onClick={stop} />
        : <IconButton label="Reload" icon={<ArrowClockwise data-slot="icon" weight="bold" />} onClick={reload} />}
    </>
  );
}

/** Every page the address bar can suggest: the sites, the history, and the current page. */
export const suggestionsFor = (url: string, visits: Visit[]) =>
  [...new Set([...(url === HOME ? [] : [url]), ...SITES.filter((s) => !s.url.startsWith("ui://")).map((s) => s.url), ...visits.map((v) => v.url)])];

/** On a phone: the tab-count button beside the address bar, and the open tabs as a sheet of cards
 * (Chrome and Safari on a phone show no tab strip). A card selects its tab; its × closes it. */
export function TabSwitcher({ tabs, active, open, onOpenChange, select, close, newTab }: {
  tabs: { id: string; url: string; loading: boolean }[]; active: string; open: boolean; onOpenChange: (open: boolean) => void;
  select: (id: string) => void; close: (id: string) => void; newTab: () => void;
}) {
  const count = tabs.length;
  const label = `${count} open ${count === 1 ? "tab" : "tabs"}`;
  return (
    <Drawer
      className="sm:hidden"
      open={open}
      onOpenChange={onOpenChange}
      title={label}
      footer={<Button size="sm" variant="primary" icon={<Plus data-slot="icon" weight="bold" />} onClick={newTab}>New tab</Button>}
      trigger={
        <Button variant="ghost" size="sm" square muted aria-label={`${label}, switch tabs`}
          icon={<span aria-hidden className="grid size-4 place-items-center rounded-[4px] border-[1.5px] border-current text-[10px] font-semibold leading-none tabular-nums">{count > 99 ? ":D" /* as Chrome does */ : count}</span>} />
      }
    >
      <ul className="grid grid-cols-2 gap-3 pb-1" aria-label="Open tabs">
        {tabs.map((t) => {
          const site = siteOf(t.url);
          const current = t.id === active;
          return (
            <li key={t.id} className={`relative flex min-w-0 flex-col overflow-hidden rounded-card bg-surface shadow-card ${current ? "outline-2 outline-accent" : ""}`}>
              <div className="flex min-w-0 items-center gap-1.5 py-1 ps-2 pe-1">
                <span className="grid size-4 shrink-0 place-items-center text-ink-2"><Favicon url={t.url} size={14} /></span>
                <button type="button" onClick={() => select(t.id)} aria-current={current ? "page" : undefined}
                  className="min-w-0 flex-1 truncate text-start text-xs text-ink after:absolute after:inset-0 after:content-['']" title={site.title}>
                  {site.title}
                </button>
                <Button variant="ghost" size="xs" shape="rounded" square muted aria-label={`Close ${site.title}`} className="relative z-1" icon={<X data-slot="icon" weight="bold" />} onClick={() => close(t.id)} />
              </div>
              <span className="truncate border-t border-line-soft bg-inset px-2 pt-2 pb-6 text-xs text-ink-2" title={t.url}>{t.url.split("/")[0]}</span>
            </li>
          );
        })}
      </ul>
    </Drawer>
  );
}
