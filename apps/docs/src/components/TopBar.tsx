/* The top bar's controls: the search field (opens the command palette, also on ⌘K / Ctrl K), the
 * framework switch, the view options (a popover: direction, animation speed, reduced motion) and the
 * theme toggle. Options that apply to the whole page live here, never on a component.
 *
 * Rendered on the client only (client:only), from the stored options read before the first render,
 * so the framework and the theme are right from the first paint; Layout.astro reserves the same room
 * with an invisible static copy (`placeholder`). Persisted across navigations (transition:persist). */
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { LocaleProvider } from "@ark-ui/react/locale";
import { MagnifyingGlass, Moon, SlidersHorizontal, Sun } from "@phosphor-icons/react";
import { Button } from "@fndn/components/button/button.tsx";
import { Input } from "@fndn/components/input/input.tsx";
import { Kbd } from "@fndn/components/kbd/kbd.tsx";
import { Popover } from "@fndn/components/popover/popover.tsx";
import { CommandPalette, type CommandPaletteItem } from "@fndn/components/command-palette/command-palette.tsx";
import { SegmentedControl } from "@fndn/components/segmented-control/segmented-control.tsx";
import { Switch } from "@fndn/components/switch/switch.tsx";
import { Tooltip } from "@fndn/components/tooltip/tooltip.tsx";
import { go, setOptions, thaw, useOptions } from "../lib/store";
import { arkLocale } from "../lib/types";
import { FRAMEWORKS, FW_LABEL, type Fw } from "../lib/types";
import { gated } from "../lib/gate";

const SPEEDS = ["1", "0.5", "0.25", "0.1"];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-7 items-center justify-between gap-4">
      <span className="text-sm text-ink-2" aria-hidden>{label}</span>
      {children}
    </div>
  );
}

export type SearchEntry = { value: string; label: string; meta: string };
const GROUPS: Record<string, string> = { Page: "Pages", Component: "Components", Block: "Blocks", Guide: "Guides", Foundation: "Foundations", Showcase: "Showcases" };

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

let INDEX: Promise<SearchEntry[]> | null = null;
const loadIndex = () => (INDEX ??= fetch("/search.json").then((r) => r.json()).catch(() => { INDEX = null; return []; }));

export default gated(TopBar, () => <div className="h-7" aria-hidden />);

function TopBar({ placeholder = false }: { placeholder?: boolean }) {
  const [search, setSearch] = useState<SearchEntry[]>([]);
  const o = useOptions();
  useEffect(() => thaw(), []);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  /* pages opened from the palette, most recent first (the top bar persists across navigations) */
  const [recent, setRecent] = useState<string[]>([]);
  const [mac] = useState(isMac);
  /* the index is fetched the first time the palette opens (or the field is pointed at) */
  useEffect(() => { if (open) void loadIndex().then(setSearch); }, [open]);
  /* the palette groups the index by kind: "Component" → "Components" */
  const items = useMemo(() => search.map((e): CommandPaletteItem => ({ value: e.value, label: e.label, group: GROUPS[e.meta] ?? e.meta })), [search]);

  /* the field only opens the palette: a printable key starts the query there */
  const onFieldKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") { e.preventDefault(); setQuery(""); setOpen(true); }
    else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); setQuery(e.key); setOpen(true); }
  };

  return (
    <LocaleProvider locale={arkLocale(o.dir)}>
      <div className="flex items-center gap-2 max-[360px]:gap-1 md:gap-3">
        <span className="relative hidden w-52 items-center md:flex lg:w-64" data-docs-search>
          <MagnifyingGlass className="pointer-events-none absolute start-2.5 size-3.5 text-ink-3" weight="bold" aria-hidden />
          <Input
            size="sm" readOnly
            className="h-7 cursor-default ps-8 pe-16"
            placeholder="Search"
            aria-label="Search the docs" aria-haspopup="dialog" aria-keyshortcuts={mac ? "Meta+K" : "Control+K"}
            onClick={() => { setQuery(""); setOpen(true); }}
            onPointerEnter={() => void loadIndex()}
            onFocus={() => void loadIndex()}
            onKeyDown={onFieldKey}
          />
          <Kbd keys={mac ? ["⌘", "K"] : ["Ctrl", "K"]} className="pointer-events-none absolute end-1.5" aria-hidden />
        </span>
        <span className="md:hidden">
          <Tooltip content="Search">
            <Button variant="ghost" size="sm" square shape="rounded" muted aria-label="Search the docs" aria-haspopup="dialog" data-docs-search-icon icon={<MagnifyingGlass data-slot="icon" weight="bold" />} onClick={() => { setQuery(""); setOpen(true); }} />
          </Tooltip>
        </span>
        {!placeholder && (
          /* the system's command palette: ⌘K / Ctrl K anywhere, instant, the field opens it too */
          <CommandPalette
            items={items}
            recent={recent}
            recentLabel="Recently opened"
            open={open}
            onOpenChange={(next) => { setOpen(next); if (!next) setQuery(""); }}
            defaultQuery={query}
            limit={8}
            title="Search the docs"
            label="Search components, blocks, foundations and guides"
            placeholder="Components, blocks, foundations, guides…"
            emptyTitle="Nothing matches"
            emptyHint="Try a component name, a foundation or a guide."
            onSelect={(href) => { setRecent((r) => [href, ...r.filter((v) => v !== href)].slice(0, 3)); go(href); }}
          />
        )}
        <SegmentedControl size="xs"
          aria-label="Framework" shape="rounded" data-docs-control="fw"
          options={FRAMEWORKS.map((f) => ({ value: f, label: FW_LABEL[f] }))}
          value={o.fw}
          onValueChange={(v) => setOptions({ fw: v as Fw })}
        />
        <Popover
          placement="bottom-end"
          title="View options"
          description="For the whole page, every component included."
          trigger={
            <Tooltip content="View options">
              <Button variant="ghost" size="sm" square shape="rounded" muted aria-label="View options" icon={<SlidersHorizontal data-slot="icon" weight="bold" />} />
            </Tooltip>
          }
        >
          <div className="flex w-72 max-w-full flex-col gap-2" data-docs-view>
            <Row label="Direction">
              <SegmentedControl size="xs"
                aria-label="Direction" shape="rounded" data-docs-control="dir"
                options={[{ value: "ltr", label: "LTR" }, { value: "rtl", label: "RTL" }]}
                value={o.dir}
                onValueChange={(v) => setOptions({ dir: v === "rtl" ? "rtl" : "ltr" })}
              />
            </Row>
            <Row label="Animation speed">
              <SegmentedControl size="xs"
                aria-label="Animation speed" shape="rounded" data-docs-control="speed"
                options={SPEEDS.map((v) => ({ value: v, label: `${v}×` }))}
                value={String(o.speed)}
                onValueChange={(v) => setOptions({ speed: Number(v) || 1 })}
              />
            </Row>
            <Row label="Reduced motion">
              <Switch size="sm" label="Reduced motion" data-docs-control="reduced" checked={o.reduced} onCheckedChange={(v) => setOptions({ reduced: v })} />
            </Row>
            {/* under 420px the bar has no room for the theme switch: it is here instead */}
            <div className="min-[420px]:hidden">
              <Row label="Theme">
                <SegmentedControl size="xs"
                  aria-label="Theme" shape="rounded" data-docs-control="theme-narrow"
                  options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]}
                  value={o.theme}
                  onValueChange={(v) => setOptions({ theme: v === "dark" ? "dark" : "light" })}
                />
              </Row>
            </div>
          </div>
        </Popover>
        <SegmentedControl size="xs"
          aria-label="Theme" shape="rounded" icons data-docs-control="theme"
          className="max-[420px]:hidden"
          options={[
            { value: "light", label: "Light", icon: <Sun data-slot="icon" weight="bold" aria-hidden /> },
            { value: "dark", label: "Dark", icon: <Moon data-slot="icon" weight="bold" aria-hidden /> },
          ]}
          value={o.theme}
          onValueChange={(v) => setOptions({ theme: v === "dark" ? "dark" : "light" })}
        />
      </div>
    </LocaleProvider>
  );
}
