/* One showcase app (showcases/<app>/App.tsx), live. Two uses:
 * - the app's page: the app fills the frame the page gives it (it lays itself out, phone included);
 * - a thumbnail on the overview: the app is laid out at a desktop size (THUMB) and fitted to the
 *   card with CSS `zoom` (never a transform: text stays crisp). The card makes it inert; it stays
 *   hidden until it is fitted, so nothing jumps.
 * `shape` is the app's shape (its index.json): the frame carries it as data-shape, as the app's own
 * <html> would. The app's page sets it on <html> too, where the app's dialogs and menus render.
 * Only the asked app's code is loaded. An app binds its shortcuts on its own root, never on the
 * document, so a thumbnail or the page around it keeps its own keys. */
import { createElement, useEffect, useLayoutEffect, useRef, useState } from "react";
import { LocaleProvider } from "@ark-ui/react/locale";
import { useOptions } from "../lib/store";
import { arkLocale } from "../lib/types";

import { files as apps } from "virtual:docs-showcase"; /* lib/vite-modules.mjs */

/** The size a thumbnail lays the app out at, before it is fitted. */
const THUMB = { width: 1280, height: 800 };
/** The smallest zoom of a thumbnail; a card narrower than THUMB at this zoom crops the app. */
const THUMB_ZOOM = 0.4;

export default function ShowcaseFrame({ name, shape, thumb = false }: { name: string; shape?: "rounded"; thumb?: boolean }) {
  const { dir } = useOptions();
  const [App, setApp] = useState<any>(undefined);
  useEffect(() => {
    let alive = true;
    void apps[name]?.().then((m) => { if (alive) setApp(() => m.default); });
    return () => { alive = false; };
  }, [name]);

  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const b = box.current, el = inner.current;
    if (!thumb || !b || !el || !App) return;
    const fit = () => {
      /* never below THUMB_ZOOM: a narrower card shows the app's top-start corner (its rail, its
         list or its editor) at a readable size instead of the whole app at a quarter of it */
      el.style.zoom = String(Math.max(THUMB_ZOOM, Math.floor((b.clientWidth / THUMB.width) * 1000) / 1000));
      el.style.visibility = "";
    };
    fit();
    const ro = new ResizeObserver(() => requestAnimationFrame(fit));
    ro.observe(b);
    return () => ro.disconnect();
  }, [thumb, App]);

  const app = App ? createElement(LocaleProvider, { locale: arkLocale(dir) }, createElement(App)) : null;
  if (!thumb) return <div className="h-full" data-docs-showcase-app={name} data-shape={shape}>{app}</div>;
  return (
    /* out of flow: before it is fitted, the 1280×800 app inside must not stretch the card's 16:10
     * box (the captions under it moved when the thumbnail hydrated: a layout shift on the overview) */
    <div ref={box} className="absolute inset-0 overflow-hidden" data-docs-showcase-thumb={name} data-shape={shape}>
      <div ref={inner} style={{ width: THUMB.width, height: THUMB.height, visibility: "hidden" }}>{app}</div>
    </div>
  );
}
