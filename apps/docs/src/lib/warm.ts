/* Getting the next page ready before it is shown.
 *
 * A component page's island needs the component's spec and, in React, its adapter. If they arrive
 * after the page is on screen, the stage and the inspector are empty for a few frames and then
 * pop in, which reads as a flicker on every navigation. So:
 *   - a link to a component page starts loading both when it is pointed at, touched or focused;
 *   - the router waits for them (600 ms at most) before it swaps the page, so the new page is
 *     complete in its first frame.
 *
 * On the built site the next page's HTML is fetched at the same moments and kept in memory, and
 * the router is handed that copy instead of fetching the page again when the link is followed: a
 * host serves pages with a short or no cache lifetime, and the browser does not reuse a page it
 * prefetched for the router's own fetch, so without this every click waits for the network. The
 * pages next to a component page (previous and next) are fetched ahead when the browser is idle
 * and the connection is not slow or metered. In development the router fetches every page itself,
 * so a page edited on disk is shown as it is now.
 * Imported by the tree, which is on every page. */
import { getOptions } from "./store";
import { componentOf, loadComponent } from "./render";
import { exampleModule } from "./example-modules";
import { loadSpec } from "./spec-cache";
import { files as reactAdapters } from "virtual:docs-adapters/react"; /* lib/vite-modules.mjs */
import { targetsOf, type Fw, type Spec } from "./types";

/** In React the stage needs the adapter; Vue and Svelte load theirs when they mount. */
export const adapterReady = (spec: Spec, fw: Fw) => fw !== "react" || !targetsOf(spec).includes("react") || componentOf(spec.name) !== undefined;

export async function prepare(name: string, fw: Fw = getOptions().fw): Promise<void> {
  /* the React adapter is most often <name>.tsx: its module is fetched with the spec, not after it
   * (one round trip instead of two); loadComponent below then finds it loaded */
  if (import.meta.env.PROD && fw === "react") void reactAdapters[`${name}.tsx`]?.().catch(() => {});
  const spec = await loadSpec(name);
  /* the first example, shown right under the stage: its module is fetched now, not after the swap
   * (not waited for: the page does not need it to be shown) */
  const first = spec.exampleFiles?.[0]?.file;
  if (import.meta.env.PROD && first && targetsOf(spec).includes(fw)) void Promise.all([
    fw === "react" ? undefined : MOUNT[fw](),
    exampleModule(fw, name, first),
  ]).catch(() => {});
  if (!adapterReady(spec, fw)) await loadComponent(spec.name, spec.files?.react?.[0]);
  /* Vue and Svelte mount their own adapter after the swap: with it loaded here, that mount takes
   * microtasks, not a fetch, and the stage is not empty for a few frames */
  if (fw === "vue" && targetsOf(spec).includes("vue")) await (mounters.vue ??= await import("./mount-vue")).preloadVue(spec.name);
  if (fw === "svelte" && targetsOf(spec).includes("svelte")) await (mounters.svelte ??= await import("./mount-svelte")).preloadSvelte(spec.name);
}

/* The mount module of Vue and of Svelte (React's comes with the component page's own code). One
 * function each, never the two imports in one conditional expression: the build gives each
 * import() the list of files to fetch with it, and the minifier folds a conditional of imports
 * into one call that keeps a single list, so a page in React fetched the Svelte runtime. */
const MOUNT: Record<Exclude<Fw, "react">, () => Promise<unknown>> = {
  vue: () => import("./mount-vue"),
  svelte: () => import("./mount-svelte"),
};

/** The Vue and Svelte mount modules once loaded, for a mount in the frame of the swap (Workbench). */
export const mounters: { vue?: typeof import("./mount-vue"); svelte?: typeof import("./mount-svelte") } = {};

const nameOf = (path: string | null | undefined) => path?.match(/^\/components\/([a-z0-9-]+)\/?$/)?.[1];

/* ── the pages' HTML, built site only ── */

/** How long a fetched page is handed to the router (a new deploy is picked up after this). */
const KEEP = 5 * 60_000;
const pages = new Map<string, { at: number; html: Promise<string | null> }>();
const keyOf = (url: URL) => url.pathname.replace(/\/$/, "") || "/";

/** A page of this site the router can show (not a file such as /llms.txt, not this page). */
function pageUrl(href: string | null | undefined): URL | undefined {
  if (!href || typeof location === "undefined") return;
  let url: URL;
  try { url = new URL(href, location.href); } catch { return; }
  if (url.origin !== location.origin || url.search || /\.[a-z0-9]+$/i.test(url.pathname) || keyOf(url) === keyOf(new URL(location.href))) return;
  return url;
}

/** Fetch a page's HTML ahead and keep it for the router (once per KEEP). */
function fetchPage(url: URL): void {
  const key = keyOf(url);
  const kept = pages.get(key);
  if (kept && Date.now() - kept.at < KEEP) return;
  const html = fetch(url.pathname)
    .then((r) => (r.ok && !r.redirected && /^text\/html/.test(r.headers.get("content-type") ?? "") ? r.text() : null))
    .catch(() => null);
  pages.set(key, { at: Date.now(), html });
}

/** The connection allows fetching what may not be used (no data saver, not 2G or 3G). */
const roomy = () => {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !c || (!c.saveData && !/(^|-)(2g|3g)$/.test(c.effectiveType ?? ""));
};

/** A link is pointed at, touched or focused: its HTML (built site) and, for a component page, its
 * spec and adapter. */
function point(href: string | null | undefined): void {
  const url = pageUrl(href);
  if (!url) return;
  if (import.meta.env.PROD) fetchPage(url);
  const name = nameOf(url.pathname);
  if (name) void prepare(name).catch(() => {});
}

/** Get a page ready from code that navigates without a link (lib/store.ts `warm`). In development,
 * the browser's own prefetch of the page. */
export function warmPage(href: string): void {
  if (import.meta.env.PROD) point(href);
  else void import("astro:prefetch").then((m) => m.prefetch(href)).catch(() => {});
}

/** The pages a visitor is likely to open next, fetched when the browser is idle (built site, and a
 * connection that allows it). */
export function ahead(hrefs: string[]): () => void {
  if (!import.meta.env.PROD || !roomy()) return () => {};
  const idle = window.requestIdleCallback ?? ((fn: () => void) => setTimeout(fn, 200));
  const cancel = window.cancelIdleCallback ?? clearTimeout;
  const id = idle(() => { for (const h of hrefs) point(h); });
  return () => cancel(id as number);
}

/** The kept copy of the page the router is going to, as the document it would have parsed; null
 * when there is none, or when the router must fetch the page itself. */
async function keptDocument(to: URL): Promise<Document | null> {
  const kept = pages.get(keyOf(to));
  if (!kept || Date.now() - kept.at >= KEEP) return null;
  const html = await kept.html;
  if (!html) return null;
  const doc = new DOMParser().parseFromString(html, "text/html");
  /* as the router does: the parser returns a <noscript>'s content as markup */
  doc.querySelectorAll("noscript").forEach((el) => el.remove());
  /* a page without the client router is a full load; a stylesheet this page has not loaded must
   * be loaded before the swap: both are the router's own path */
  if (!doc.querySelector('[name="astro-view-transitions-enabled"]')) return null;
  const sheets = new Set([...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map((l) => l.getAttribute("href")));
  if ([...doc.querySelectorAll('link[rel="stylesheet"]')].some((l) => !sheets.has(l.getAttribute("href")))) return null;
  return doc;
}

if (typeof document !== "undefined") {
  const onPoint = (e: Event) => point((e.target as Element | null)?.closest?.("a[href]")?.getAttribute("href"));
  document.addEventListener("pointerover", onPoint, { passive: true });
  document.addEventListener("focusin", onPoint, { passive: true });
  /* the client router fetches the next page here: hand it the kept copy, and wait for the
   * island's data with it */
  document.addEventListener("astro:before-preparation", (e) => {
    const event = e as Event & { to?: URL; loader?: () => Promise<void>; newDocument?: Document; formData?: FormData };
    const name = nameOf(event.to?.pathname);
    const load = event.loader;
    const to = event.to;
    if (!load || !to) return;
    const kept = import.meta.env.PROD && !event.formData;
    if (!name && !kept) return;
    event.loader = async () => {
      const ready = name ? Promise.race([prepare(name).catch(() => {}), new Promise<void>((done) => setTimeout(done, 600))]) : undefined;
      const page = async () => {
        const doc = kept ? await keptDocument(to).catch(() => null) : null;
        if (doc) event.newDocument = doc;
        else await load();
      };
      await Promise.all([page(), ready]);
    };
  });
}
