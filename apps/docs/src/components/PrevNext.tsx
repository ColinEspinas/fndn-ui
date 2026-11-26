/* Previous / next component in catalogue order, in the page header: two icon buttons with
 * tooltips, and the `[` / `]` shortcuts (not while typing in a field). */
import { useEffect } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Button } from "@fndn/components/button/button.tsx";
import { Tooltip } from "@fndn/components/tooltip/tooltip.tsx";
import { go } from "../lib/store";
import { ahead, warmPage } from "../lib/warm";

type Link = { name: string; title: string };
const typing = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest("input, textarea, select, [contenteditable=true], [role=combobox]");

export default function PrevNext({ prev, next }: { prev: Link; next: Link }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      if (e.key === "[") { e.preventDefault(); go(`/components/${prev.name}`); }
      if (e.key === "]") { e.preventDefault(); go(`/components/${next.name}`); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [prev.name, next.name]);
  /* the neighbours are the likeliest next pages: ready ahead on the built site (lib/warm.ts) */
  useEffect(() => ahead([`/components/${prev.name}`, `/components/${next.name}`]), [prev.name, next.name]);
  return (
    <span className="flex items-center gap-1" data-docs-prevnext>
      <Tooltip content={`Previous: ${prev.title}`} shortcut="[">
        <Button variant="ghost" size="sm" square shape="rounded" muted aria-label={`Previous: ${prev.title}`} aria-keyshortcuts="[" icon={<CaretLeft data-slot="icon" className="rtl:-scale-x-100" weight="bold" />} onPointerEnter={() => warmPage(`/components/${prev.name}`)} onFocus={() => warmPage(`/components/${prev.name}`)} onClick={() => go(`/components/${prev.name}`)} />
      </Tooltip>
      <Tooltip content={`Next: ${next.title}`} shortcut="]">
        <Button variant="ghost" size="sm" square shape="rounded" muted aria-label={`Next: ${next.title}`} aria-keyshortcuts="]" icon={<CaretRight data-slot="icon" className="rtl:-scale-x-100" weight="bold" />} onPointerEnter={() => warmPage(`/components/${next.name}`)} onFocus={() => warmPage(`/components/${next.name}`)} onClick={() => go(`/components/${next.name}`)} />
      </Tooltip>
    </span>
  );
}
