/* The icons page's filter: narrows the server-rendered grid ([data-docs-icons] > li, by data-name)
 * and copies an icon's name when it is pressed. The grid stays static HTML (no icon set ships to the
 * browser); this island only toggles `hidden` and says what happened. */
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@fndn/components/empty-state/empty-state.tsx";
import { Input } from "@fndn/components/input/input.tsx";

export default function IconFilter({ total }: { total: number }) {
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(total);
  const [said, setSaid] = useState("");
  const grid = useRef<HTMLElement | null>(null);

  useEffect(() => {
    grid.current = document.querySelector("[data-docs-icons]");
    const onClick = async (e: Event) => {
      const b = (e.target as Element).closest<HTMLElement>("[data-docs-icon]");
      if (!b) return;
      const name = b.dataset.docsIcon!;
      try { await navigator.clipboard.writeText(name); setSaid(`Copied “${name}”`); } catch { setSaid(name); }
    };
    grid.current?.addEventListener("click", onClick);
    return () => grid.current?.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const needle = q.trim().toLowerCase();
    let n = 0;
    for (const li of grid.current?.querySelectorAll<HTMLElement>(":scope > li") ?? []) {
      const show = !needle || (li.dataset.name ?? "").includes(needle);
      li.hidden = !show;
      if (show) n++;
    }
    setShown(n);
    setSaid("");
  }, [q]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Input size="sm" type="search" placeholder={`Filter ${total} icons`} aria-label="Filter icons" autoComplete="off" spellCheck={false} className="w-64 max-w-full" value={q} onChange={(e) => setQ((e.target as HTMLInputElement).value)} />
        <span className="text-sm text-ink-2" role="status">{said || (q ? `${shown} of ${total}` : "")}</span>
      </div>
      {shown === 0 && <EmptyState title="No icon matches" icon="magnifying-glass" />}
    </div>
  );
}
