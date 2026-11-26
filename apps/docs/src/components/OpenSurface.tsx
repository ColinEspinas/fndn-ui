/* The open surface of an overlay, for its overview card: a still of what the component shows once
 * it is open (Radix and Ark show the open surface first, not a lone trigger). The real overlays
 * open in a portal, trap focus and lock the page, which a grid of cards cannot hold; this is a
 * static render of the same parts, with the components' own recipes and the real Button, Kbd and
 * Search, from the playground's props (components/<name>/examples/index.json). The card makes it
 * inert. Nothing animates: it is painted open (data-state="open", transitions off). */
import type { ReactNode } from "react";
import { X } from "@phosphor-icons/react";
import { Button } from "@fndn/components/button/button.tsx";
import { Kbd } from "@fndn/components/kbd/kbd.tsx";
import { Search } from "@fndn/components/search/search.tsx";
import { paletteRows } from "@fndn/components/search/search.logic.ts";
import { dialog } from "@fndn/components/dialog/dialog.recipe.ts";
import { drawer } from "@fndn/components/drawer/drawer.recipe.ts";
import { tooltip } from "@fndn/components/tooltip/tooltip.recipe.ts";
import { hoverCard } from "@fndn/components/hover-card/hover-card.recipe.ts";
import { commandPalette } from "@fndn/components/command-palette/command-palette.recipe.ts";

/** The overlays whose card shows them open. */
export const OPEN_SURFACES = ["dialog", "alert-dialog", "drawer", "tooltip", "hover-card", "command-palette"] as const;
export const hasOpenSurface = (name: string) => (OPEN_SURFACES as readonly string[]).includes(name);

type Props = Record<string, any>;
type Action = { label: string; value?: string; variant?: any };

const OPEN = { "data-state": "open" } as const;
/* a still: the entrance never plays (the card is shown already open) */
const STILL = "[&_*]:transition-none! [&_*]:animate-none!";

const Close = ({ className }: { className: string }) => (
  <Button className={className} variant="ghost" size="sm" shape="rounded" square muted aria-label="Close" icon={<X data-slot="icon" weight="bold" />} />
);

function Window({ r, title, description, body, footer, close = true }: { r: ReturnType<typeof dialog> | ReturnType<typeof drawer>; title: string; description?: string; body?: ReactNode; footer?: ReactNode; close?: boolean }) {
  return (
    <>
      <div className={r.header()}>
        <h2 className={r.title()}>{title}</h2>
        {close && <Close className={r.close()} />}
      </div>
      {description && <p className={r.description()}>{description}</p>}
      {body && <div className={r.body()}>{body}</div>}
      {footer && <div className={r.footer()}>{footer}</div>}
    </>
  );
}

const actionsOf = (actions: Action[] | undefined) =>
  actions?.length ? actions.map((a) => <Button key={a.value ?? a.label} variant={a.variant ?? "outline"} size="sm">{a.label}</Button>) : undefined;

export default function OpenSurface({ name, props: p, text }: { name: string; props: Props; text?: string }) {
  if (name === "dialog" || name === "alert-dialog") {
    const r = dialog({ size: "sm" });
    const footer = name === "alert-dialog"
      ? <><Button variant="ghost" size="sm">{p.cancelLabel ?? "Cancel"}</Button><Button variant={p.tone === "neutral" ? "primary" : "danger"} size="sm">{p.actionLabel ?? "Continue"}</Button></>
      : actionsOf(p.actions);
    return (
      <div className={`w-[320px] ${STILL}`} data-docs-open-surface={name}>
        <div {...OPEN} className={r.content()}>
          <Window r={r} title={p.title} description={p.description} body={text} footer={footer} close={name === "dialog" && p.closable !== false} />
        </div>
      </div>
    );
  }
  if (name === "drawer") {
    /* the sheet from the end edge, against the strip of page it covers */
    const r = drawer({ side: "end" });
    return (
      <div className={`flex h-[188px] w-[300px] justify-end overflow-hidden rounded-window bg-scrim ${STILL}`} data-docs-open-surface={name}>
        <div {...OPEN} className={`${r.content()} w-[244px]!`}>
          <Window r={r} title={p.title} description={p.description} body={text} footer={actionsOf(p.actions)} close={p.closable !== false} />
        </div>
      </div>
    );
  }
  if (name === "tooltip") {
    const r = tooltip();
    return (
      <div className={`flex flex-col items-center gap-1.5 ${STILL}`} data-docs-open-surface={name}>
        <div {...OPEN} className={r.base()}>
          <span className={r.label()}>{p.content}</span>
          {p.shortcut && <Kbd className={r.shortcut()} variant="plain" keys={[p.shortcut]} />}
        </div>
        <Button variant="outline" size="sm">{p.triggerLabel ?? "Hover me"}</Button>
      </div>
    );
  }
  if (name === "hover-card") {
    const r = hoverCard();
    const lines = (p.lines ?? []) as { text: string; tone?: "ctx" | "add" | "del" }[];
    const SIGN = { ctx: " ", add: "+", del: "−" } as const;
    return (
      <div className={`flex flex-col items-start gap-1.5 ${STILL}`} data-docs-open-surface={name}>
        <span className={r.trigger()}>{p.triggerLabel}</span>
        <div {...OPEN} className={r.content()}>
          {(p.title || p.add !== undefined || p.del !== undefined) && (
            <div className={r.header()}>
              {p.title && <span className={r.title()}>{p.title}</span>}
              <span className={r.meta()}>
                {p.add !== undefined && <span className={r.add()}>{`+${p.add}`}</span>}
                {p.del !== undefined && <span className={r.del()}>{`−${p.del}`}</span>}
              </span>
            </div>
          )}
          {lines.length > 0 && (
            <div className={r.lines()}>
              {lines.map((l, i) => (
                <div key={i} className={r.line({ tone: l.tone ?? "ctx" })}>
                  <span className={r.sign()}>{SIGN[l.tone ?? "ctx"]}</span>
                  <span className={r.text()}>{l.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  if (name === "command-palette") {
    /* the palette is the Search panel in a bare dialog: the panel is what shows */
    const r = commandPalette();
    const rows = paletteRows(p.items ?? [], p.recent ?? [], p.recentLabel ?? "Recent", "");
    return (
      <div className={`w-[400px] ${STILL}`} data-docs-open-surface={name}>
        <Search className={r.search()} items={rows} limit={(p.recent?.length ?? 0) + (p.limit ?? 8)} placeholder={p.placeholder} label={p.label ?? "Search commands"} highlightFirst />
      </div>
    );
  }
  return null;
}
