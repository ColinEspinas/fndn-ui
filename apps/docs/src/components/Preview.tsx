/* A live example on an overview card: the component's first example file, rendered in React (a
 * file that plays steps plays them once). The card makes it inert; here it is only placed in the
 * box with CSS `zoom` (never a transform: text stays crisp). It stays hidden until it is placed, so
 * nothing jumps.
 *
 * One scale per section, so cards side by side read at one size:
 * - a component is shown at its real size; one that fills its container is laid out at the box's
 *   width; only one that cannot fit is shrunk;
 * - a block is laid out at the box's width over BLOCK_ZOOM and shown at BLOCK_ZOOM, from its top:
 *   what does not fit is cropped under a fade, never shrunk to unreadable type;
 * - an overlay (OpenSurface) shows its open surface, a still, instead of a lone trigger. */
import { createElement, useEffect, useLayoutEffect, useRef, useState } from "react";
import { LocaleProvider } from "@ark-ui/react/locale";
import { loadReactExample } from "../lib/mount-react";
import { useOptions } from "../lib/store";
import { arkLocale } from "../lib/types";
import OpenSurface from "./OpenSurface";

export type PreviewProps = { name: string; file: string; block: boolean;
  /** An overlay: its playground props, shown as the open surface instead of the example. */
  surface?: { props: Record<string, unknown>; text?: string } };

/** Inner padding of the box, each side (px). */
const PAD = 20;
/** The scale of every block card. */
const BLOCK_ZOOM = 0.75;
/** Components are laid out as if their card were this wide (most examples are this wide), then the
 * whole section takes one zoom: the card's width over it, never above 1. */
const COMPONENT = 320;
/** A component is never shown smaller than this; past it the box crops it. */
const MIN_ZOOM = 0.5;

export default function Preview({ name, file, block, surface }: PreviewProps) {
  const { dir } = useOptions();
  /* only this card's example is loaded, when the card comes near the viewport */
  const [Component, setComponent] = useState<any>(surface ? () => () => createElement(OpenSurface, { name, props: surface.props, text: surface.text }) : undefined);
  useEffect(() => {
    if (surface) return;
    let alive = true;
    void loadReactExample(name, file).then((c) => { if (alive) setComponent(() => c ?? null); });
    return () => { alive = false; };
  }, [name, file, !!surface]);
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [cropped, setCropped] = useState(false);

  useLayoutEffect(() => {
    const b = box.current, el = inner.current;
    if (!b || !el || !Component) return;
    const fit = () => {
      const room = Math.max(1, b.clientWidth - 2 * PAD), tall = Math.max(1, b.clientHeight - 2 * PAD);
      el.style.zoom = "1";
      let z = 1;
      if (block) {
        /* laid out at the width the box gives at BLOCK_ZOOM (a still keeps its own width); wider
           content is shrunk to the box; a taller one is cropped, never shrunk */
        const w = room / BLOCK_ZOOM;
        if (!surface) {
          el.style.width = `${w}px`;
          /* a block narrower than that (a card with a max width) is centred at its own width */
          const child = el.firstElementChild as HTMLElement | null;
          if (child && child.getBoundingClientRect().width < w - 1 && el.scrollWidth <= w + 1) el.style.width = "max-content";
        }
        const need = surface || el.style.width === "max-content" ? el.offsetWidth : el.scrollWidth;
        z = need > w + 1 ? BLOCK_ZOOM * (w / need) : BLOCK_ZOOM;
      } else {
        /* the section's zoom; an example that fills its container (a field, a table, a progress
           bar) collapses at max-content: it is laid out at the card's width at that zoom */
        const base = Math.min(1, room / COMPONENT);
        const at = room / base;
        el.style.width = `${at}px`;
        const child = el.firstElementChild as HTMLElement | null;
        if (!child || Math.abs(child.getBoundingClientRect().width - at) > 0.5) el.style.width = "";
        const w = el.offsetWidth, h = el.offsetHeight;
        /* only what cannot fit at the section's zoom is shown smaller */
        z = Math.max(MIN_ZOOM, Math.min(base, room / Math.max(1, w), tall / Math.max(1, h)));
      }
      /* two decimals: sizes stay stable from card to card */
      z = Math.floor(z * 100 + 1e-6) / 100;
      el.style.zoom = String(z);
      setCropped(el.offsetHeight * z > tall + 1);
      el.style.visibility = "";
    };
    fit();
    /* refit in the next frame, never inside the observer's own delivery */
    let raf = 0;
    const later = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(fit); };
    const ro = new ResizeObserver(later);
    ro.observe(b);
    /* the example's own size (zoom on its parent leaves it alone, so this cannot loop) */
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    void document.fonts?.ready.then(later);
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, [dir, Component, block]);

  /* centred while it fits; `safe` keeps the top in view if the example grows before the next fit
   * (a block is cropped from its top, never from both edges) */
  return (
    <div
      ref={box}
      className={`grid h-full w-full justify-items-center overflow-hidden ${cropped ? "content-start [mask-image:linear-gradient(to_bottom,black_75%,transparent)]" : "[align-content:safe_center]"}`}
      style={{ padding: PAD }}
      data-docs-preview
    >
      <div ref={inner} className={block && !surface ? "" : "w-max max-w-none"} style={{ visibility: Component === null ? undefined : "hidden" }}>
        {Component ? createElement(LocaleProvider, { locale: arkLocale(dir) }, createElement(Component)) : null}
      </div>
    </div>
  );
}
