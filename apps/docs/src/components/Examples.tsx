/* The Examples of a component page: every file of components/<name>/examples/ in index.json's order, live in
 * the selected framework, with its source as written one click away under it, closed by default
 * (imports shown as a project writes them after `fndn add`). An example is mounted when it comes near the viewport; one that plays steps has its
 * own Replay. */
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowCounterClockwise } from "@phosphor-icons/react";
import { Button } from "@fndn/components/button/button.tsx";
import { CodeBlock } from "@fndn/components/code-block/code-block.tsx";
import { Collapsible } from "@fndn/components/collapsible/collapsible.tsx";
import { EmptyState } from "@fndn/components/empty-state/empty-state.tsx";
import { Tooltip } from "@fndn/components/tooltip/tooltip.tsx";
import { mountExample, type Unmount } from "../lib/examples-live";
import { FW_LABEL, targetsOf, type Fw, type Spec } from "../lib/types";

type Dir = "ltr" | "rtl";
type Sources = Record<Fw, Record<string, string>>;
const EXT: Record<Fw, string> = { react: "tsx", vue: "vue", svelte: "svelte" };

/* the sources of a component's examples (/example-code/<name>.json), fetched once and kept */
const CODES = new Map<string, Promise<Sources>>();
const loadCodes = (name: string) => {
  let p = CODES.get(name);
  if (!p) { p = fetch(`/example-code/${name}.json`).then((r) => r.json()); CODES.set(name, p); }
  return p;
};
/* dev: a file of a component was saved (lib/vite-modules.mjs): its sources are fetched again, and
 * the open list shows the new ones (the example itself updates by its module's hot update) */
const saved = new Set<(name: string) => void>();
if (import.meta.hot) import.meta.hot.on("docs:content", ({ name }: { name: string }) => { CODES.delete(name); for (const f of saved) f(name); });

/** One quiet line where a framework the component has no adapter for is selected. */
export function Unavailable({ spec, fw }: { spec: Spec; fw: Fw }) {
  const has = targetsOf(spec).map((f) => FW_LABEL[f]);
  const list = has.length > 1 ? `${has.slice(0, -1).join(", ")} and ${has.at(-1)}` : has[0];
  return <p className="text-sm text-ink-2" data-docs-unavailable>{`Not available in ${FW_LABEL[fw]} yet. ${list} only for now.`}</p>;
}

export default function Examples({ spec, fw, dir, available }: { spec: Spec; fw: Fw; dir: Dir; available: boolean }) {
  const list = spec.exampleFiles ?? [];
  const [codes, setCodes] = useState<Sources | null>(null);
  useEffect(() => {
    if (!list.length) return;
    let alive = true;
    const load = () => void loadCodes(spec.name).then((c) => { if (alive) setCodes(c); }).catch(() => {});
    load();
    const onSaved = (name: string) => { if (name === spec.name) load(); };
    saved.add(onSaved);
    return () => { alive = false; saved.delete(onSaved); };
  }, [spec.name, list.length]);
  if (!list.length) return null;
  return (
    <section aria-labelledby="docs-examples" className="flex min-w-0 flex-col gap-10" data-docs-examples-list>
      <h2 id="docs-examples" className="-mb-7 text-md font-semibold text-ink">Examples</h2>
      {list.map((x) => (
        <Item key={x.file} spec={spec} file={x.file} title={x.title} steps={!!x.steps} fw={fw} dir={dir} available={available}
          code={codes ? codes[fw]?.[x.file] ?? null : undefined} />
      ))}
    </section>
  );
}

/** `code`: undefined while the sources load, null when this framework has no such file. */
function Item({ spec, file, title, steps, fw, dir, available, code }: { spec: Spec; file: string; title: string; steps: boolean; fw: Fw; dir: Dir; available: boolean; code: string | null | undefined }) {
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [replay, setReplay] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el || near) return;
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { setNear(true); io.disconnect(); } }, { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  const missing = code === null;
  const id = `docs-example-${file}`;
  return (
    <article aria-labelledby={id} className="flex min-w-0 flex-col gap-3" data-docs-example={file}>
      <div className="flex min-h-7 items-center gap-3">
        <h3 id={id} className="min-w-0 flex-1 text-sm font-semibold text-ink [unicode-bidi:plaintext]">{title}</h3>
        {steps && available && !missing && (
          <Tooltip content="Replay">
            <Button variant="ghost" size="sm" square shape="rounded" muted aria-label={`Replay ${title}`} data-docs-example-replay icon={<ArrowCounterClockwise data-slot="icon" weight="bold" />} onClick={() => setReplay((n) => n + 1)} />
          </Tooltip>
        )}
      </div>
      <div ref={box} className="flex min-h-36 min-w-0 items-center-safe justify-center-safe overflow-x-auto [&_[data-docs-fw]]:min-w-0 [&_[data-docs-fw]]:max-w-full [&_[data-docs-fw]>*]:max-w-full rounded-card border border-line bg-surface p-4 sm:p-8" data-docs-example-mount>
        {!available ? <Unavailable spec={spec} fw={fw} />
          : missing ? <p className="text-sm text-ink-2">{`This example has no ${FW_LABEL[fw]} file yet.`}</p>
          : near ? <Boundary key={`${fw}-${dir}-${replay}`}><Live name={spec.name} file={file} fw={fw} dir={dir} /></Boundary>
          : null}
      </div>
      {/* the source one click away, so the page reads as a list of previews;
          closed, it stays in the page (the region is only hidden) for find-in-page and agents */}
      {available && !missing && (
        <Collapsible variant="inline" caret="start" label="Code" meta={`${file}.${EXT[fw]}`} className="-mt-1" data-docs-example-toggle>
          <CodeBlock filename={`${file}.${EXT[fw]}`} value={code ?? ""} maxHeight={480} wrap={false} className="mt-2 max-w-none" aria-label={`${title}, ${FW_LABEL[fw]} source`} aria-busy={code === undefined || undefined} data-docs-example-code />
        </Collapsible>
      )}
    </article>
  );
}

/* the example mounted by its framework's runtime in an element of its own (lib/examples-live.ts) */
function Live({ name, file, fw, dir }: { name: string; file: string; fw: Fw; dir: Dir }) {
  const holder = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const node = holder.current;
    if (!node) return;
    const host = document.createElement("div");
    host.dataset.docsFw = fw;
    node.append(host);
    let alive = true, unmount: Unmount | null = null;
    (async () => {
      const u = await mountExample(fw, host, name, file, dir);
      if (!alive) { u(); return; }
      unmount = u;
    })().catch((e: Error) => { if (alive) setError(e.message); });
    /* the host leaves the page at once; its framework unmounts it after this commit */
    return () => { alive = false; host.remove(); const u = unmount; if (u) setTimeout(u); };
  }, [name, file, fw, dir]);
  if (error) return <EmptyState size="block" icon="file" title="This example could not render" hint={error} role="alert" />;
  /* min-w-0 and max-w-full, as the playground's stage: a wide example (a table) is capped at the
   * stage's width and scrolls inside its own card instead of running past the stage */
  return <div ref={holder} className="flex min-w-0 max-w-full" />;
}

class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) return <EmptyState size="block" icon="file" title="This example could not render" hint={this.state.error.message} role="alert" />;
    return this.props.children;
  }
}
