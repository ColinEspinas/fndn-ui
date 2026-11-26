/* The browser's data: the sites it can show, the bookmarks bar, the history and the downloads.
 * A page is addressed by its URL without the scheme, as the address bar shows it. */

export type Site = {
  url: string;
  title: string;
  /** Favicon: two letters on a coloured square (an Avatar), or an internal page's icon. */
  mark: string;
  color: string;
  /** Served over https: the address bar shows a lock. */
  secure: boolean;
};

export const HOME = "ui://newtab";
export const HISTORY = "ui://history";
export const SETTINGS = "ui://settings";

export const SITES: Site[] = [
  { url: HOME, title: "New tab", mark: "", color: "", secure: true },
  { url: HISTORY, title: "History", mark: "", color: "", secure: true },
  { url: SETTINGS, title: "Settings", mark: "", color: "", secure: true },
  { url: "harbor.dev/docs/getting-started", title: "Getting started · Harbor Docs", mark: "H", color: "oklch(0.55 0.17 255)", secure: true },
  { url: "harbor.dev/docs/preview-deploys", title: "Preview deploys · Harbor Docs", mark: "H", color: "oklch(0.55 0.17 255)", secure: true },
  { url: "harbor.dev/blog/harbor-2-4", title: "Harbor 2.4: preview deploys for every pull request", mark: "H", color: "oklch(0.55 0.17 255)", secure: true },
  { url: "status.harbor.dev", title: "Harbor Status", mark: "S", color: "oklch(0.6 0.15 150)", secure: true },
  { url: "fieldnotes.app/northwind/q4-planning", title: "Q4 planning — Fieldnotes", mark: "F", color: "oklch(0.62 0.16 45)", secure: true },
  { url: "intranet.local/wiki/on-call", title: "On-call rotation · Wiki", mark: "W", color: "oklch(0.5 0.02 260)", secure: false },
];

/** A known site, a search (titled by its query), or an unknown domain (titled by its address). */
export function siteOf(url: string): Site {
  const known = SITES.find((s) => s.url === url);
  if (known) return known;
  const search = searchQuery(url);
  const title = search ? `${search.q} — ${search.engine}` : url;
  return { url, title, mark: (search?.engine ?? url).slice(0, 1).toUpperCase(), color: "oklch(0.55 0.02 260)", secure: true };
}

export const ENGINES = [
  { value: "duckduckgo", label: "DuckDuckGo", prefix: "duckduckgo.com/?q=" },
  { value: "startpage", label: "Startpage", prefix: "startpage.com/search?q=" },
  { value: "kagi", label: "Kagi", prefix: "kagi.com/search?q=" },
];

/** What the address bar does with typed text: a known page, a domain, or a search. */
export function resolve(text: string, engine: string): string {
  const t = text.trim().replace(/^https?:\/\//, "");
  if (SITES.some((s) => s.url === t) || /^[^\s]+\.[a-z]{2,}(\/\S*)?$/i.test(t)) return t;
  const prefix = ENGINES.find((e) => e.value === engine)?.prefix ?? ENGINES[0]!.prefix;
  return prefix + encodeURIComponent(t);
}

/** The query of a search URL, or null. */
export const searchQuery = (url: string) => {
  const engine = ENGINES.find((e) => url.startsWith(e.prefix));
  return engine ? { engine: engine.label, q: decodeURIComponent(url.slice(engine.prefix.length)) } : null;
};

export type Bookmark = { url: string; label: string };
export const BOOKMARKS: Bookmark[] = [
  { url: "harbor.dev/docs/getting-started", label: "Harbor Docs" },
  { url: "status.harbor.dev", label: "Status" },
  { url: "fieldnotes.app/northwind/q4-planning", label: "Q4 planning" },
];
/** The "Reading list" folder of the bookmarks bar. */
export const READING: Bookmark[] = [
  { url: "harbor.dev/blog/harbor-2-4", label: "Harbor 2.4 release notes" },
  { url: "harbor.dev/docs/preview-deploys", label: "Preview deploys" },
  { url: "intranet.local/wiki/on-call", label: "On-call rotation" },
];

export type Visit = { url: string; time: string; day: "today" | "yesterday" | "week" };
export const VISITS: Visit[] = [
  { url: "status.harbor.dev", time: "09:42", day: "today" },
  { url: "harbor.dev/docs/preview-deploys", time: "09:31", day: "today" },
  { url: "harbor.dev/docs/getting-started", time: "09:28", day: "today" },
  { url: "fieldnotes.app/northwind/q4-planning", time: "08:55", day: "today" },
  { url: "intranet.local/wiki/on-call", time: "17:20", day: "yesterday" },
  { url: "harbor.dev/blog/harbor-2-4", time: "16:04", day: "yesterday" },
  { url: "duckduckgo.com/?q=harbor%20preview%20deploys%20github%20actions", time: "15:58", day: "yesterday" },
  { url: "fieldnotes.app/northwind/q4-planning", time: "Mon 11:12", day: "week" },
];

export type Download = { id: string; name: string; size: number; received: number; kind: "pdf" | "archive" | "file" };
/* every seeded download has finished: nothing runs (or spins) until the user starts one */
export const DOWNLOADS: Download[] = [
  { id: "invoice", name: "invoice-2026-10.pdf", size: 0.2, received: 0.2, kind: "pdf" },
  { id: "assets", name: "brand-assets-v3.zip", size: 148, received: 148, kind: "archive" },
];
/** What the Download link on the Getting started page fetches. */
export const CLI_DOWNLOAD = { name: "harbor-cli-2.4.0-linux-x64.tar.gz", size: 20.3, kind: "archive" } as const;
