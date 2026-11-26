/* Page-wide options shared by the islands of one page (they share this module): framework,
 * direction, theme, animation speed, reduced motion, and whether the tree is open on a phone.
 *
 * Theme and direction live on <html> and in localStorage; the inline script in Layout.astro applies
 * them before the first paint. The framework is remembered in localStorage too; speed and reduced
 * motion are for the session. During server rendering and hydration every island sees DEFAULTS
 * (getServerSnapshot), then React re-renders with the stored values; the boot script freezes
 * transitions until then (data-fndn-theme-switching), so no switch glides into place on load. */
import { useSyncExternalStore } from "react";
import { reducedMotion, tokens } from "@fndn/core/tokens";
import { setTheme } from "../../../../packages/core/src/theme";
import { FRAMEWORKS, type Fw } from "./types";

export type Options = { fw: Fw; dir: "ltr" | "rtl"; theme: "light" | "dark"; speed: number; reduced: boolean; treeOpen: boolean };
const DEFAULTS: Options = { fw: "react", dir: "ltr", theme: "light", speed: 1, reduced: false, treeOpen: false };

export const KEYS = { fw: "fndn-docs-fw", dir: "fndn-docs-dir", speed: "fndn-docs-speed", reduced: "fndn-docs-reduced" } as const;
const get = (s: Storage | undefined, k: string) => { try { return s?.getItem(k) ?? null; } catch { return null; } };
const put = (s: Storage | undefined, k: string, v: string | null) => { try { if (v === null) s?.removeItem(k); else s?.setItem(k, v); } catch { /* private mode */ } };

let state: Options = DEFAULTS;
const listeners = new Set<() => void>();

function read(): Options {
  const html = document.documentElement;
  const fw = get(localStorage, KEYS.fw);
  return {
    fw: (FRAMEWORKS as readonly string[]).includes(fw ?? "") ? (fw as Fw) : "react",
    dir: html.dir === "rtl" ? "rtl" : "ltr",
    theme: html.dataset.theme === "dark" ? "dark" : "light",
    speed: Number(get(sessionStorage, KEYS.speed)) || 1,
    reduced: get(sessionStorage, KEYS.reduced) === "1",
    treeOpen: false,
  };
}


export function useOptions(): Options {
  return useSyncExternalStore(
    (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    () => state,
    () => DEFAULTS,
  );
}

export function setOptions(next: Partial<Options>): void {
  const prev = state;
  state = { ...state, ...next };
  const html = document.documentElement;
  if (next.fw && next.fw !== prev.fw) put(localStorage, KEYS.fw, next.fw === "react" ? null : next.fw);
  if (next.dir && next.dir !== prev.dir) { html.dir = next.dir; put(localStorage, KEYS.dir, next.dir === "rtl" ? "rtl" : null); }
  if (next.theme && next.theme !== prev.theme) setTheme(next.theme);
  if ((next.speed !== undefined && next.speed !== prev.speed) || (next.reduced !== undefined && next.reduced !== prev.reduced)) {
    put(sessionStorage, KEYS.speed, state.speed === 1 ? null : String(state.speed));
    put(sessionStorage, KEYS.reduced, state.reduced ? "1" : null);
    applyMotion(state.speed, state.reduced);
  }
  for (const fn of listeners) fn();
}

export const getOptions = () => state;

/** Go to a page of the site through Astro's client router (the shell stays), else a plain load. */
export function go(href: string): void {
  void import("astro:transitions/client").then((m) => m.navigate(href)).catch(() => { location.href = href; });
}

/** Fetch a page ahead (pointer or focus on something that will navigate there). */
export function warm(href: string): void {
  void import("astro:prefetch").then((m) => m.prefetch(href)).catch(() => {});
}

/* the current path, for the persisted tree (its `current` prop is from the first page it was on) */
const pathListeners = new Set<() => void>();
export function usePath(initial: string): string {
  return useSyncExternalStore(
    (fn) => { pathListeners.add(fn); return () => pathListeners.delete(fn); },
    () => (typeof location === "undefined" ? initial : location.pathname.replace(/\/$/, "") || "/"),
    () => initial,
  );
}
if (typeof document !== "undefined") {
  /* after-swap: the location has moved and the new page is in; the tree marks its row in the same
   * frame (page-load comes after the scripts, a frame or more later) */
  const onPath = () => { for (const fn of pathListeners) fn(); };
  document.addEventListener("astro:after-swap", onPath);
  document.addEventListener("astro:page-load", onPath);
  /* the new page closes the phone drawer */
  document.addEventListener("astro:after-swap", () => { if (state.treeOpen) setOptions({ treeOpen: false }); });
}

/* Lift the boot script's transition freeze once the islands have taken the stored values. */
let thawed = false;
export function thaw(): void {
  if (thawed || typeof document === "undefined") return;
  thawed = true;
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.removeAttribute("data-fndn-theme-switching")));
}

/* ── slow motion and simulated reduced motion ──
 * Every duration is a --fndn-duration-* token, so slowing down scales each token inline on <html>.
 * Loops (spinners, shimmer) get playbackRate. */
const isLoop = (a: Animation) => a.effect?.getTiming().iterations === Infinity;
let rate = 1;
function applyMotion(speed: number, reduced: boolean): void {
  rate = speed;
  const root = document.documentElement;
  const rd = reducedMotion.duration as Record<string, string>;
  const rm = reducedMotion.motion as Record<string, string>;
  for (const [k, v] of Object.entries(tokens.duration)) {
    const b = reduced && k in rd ? rd[k]! : (v as string);
    if (speed === 1 && !reduced) root.style.removeProperty(`--fndn-duration-${k}`);
    else root.style.setProperty(`--fndn-duration-${k}`, `${Math.round((parseFloat(b) / speed) * 100) / 100}ms`);
  }
  for (const k of Object.keys(tokens.motion)) {
    if (reduced && k in rm) root.style.setProperty(`--fndn-motion-${k}`, rm[k]!);
    else root.style.removeProperty(`--fndn-motion-${k}`);
  }
  for (const a of document.getAnimations()) if (isLoop(a)) a.playbackRate = speed;
}
if (typeof document !== "undefined") {
  document.addEventListener("animationstart", () => {
    if (rate === 1) return;
    for (const a of document.getAnimations()) if (isLoop(a) && a.playbackRate !== rate) a.playbackRate = rate;
  }, true);
}

/* the stored options, read once per page (after everything above is defined) */
if (typeof document !== "undefined") {
  state = read();
  applyMotion(state.speed, state.reduced);
}
