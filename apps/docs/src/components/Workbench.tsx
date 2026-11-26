/* The component page's one island, in the framework the top bar selects: the Playground (the stage
 * on a flat surface, starting from components/<name>/examples/index.json's `playground` with its looks at the
 * spec's defaults, with the Worst case
 * switch and Replay; the code generated for exactly what the stage shows, then the files `fndn add`
 * writes: its recipe, its adapter and what they import), the inspector whose props drive it, then the Examples: every
 * example file live, its source one click away (./Examples.tsx). Everything is the system's own components. */
import { Component, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowCounterClockwise } from "@phosphor-icons/react";
import { Button } from "@fndn/components/button/button.tsx";
import { CodeBlock, type CodeBlockFile } from "@fndn/components/code-block/code-block.tsx";
import { EmptyState } from "@fndn/components/empty-state/empty-state.tsx";
import { Pager } from "@fndn/components/pager/pager.tsx";
import { SegmentedControl } from "@fndn/components/segmented-control/segmented-control.tsx";
import { Select } from "@fndn/components/select/select.tsx";
import { Switch } from "@fndn/components/switch/switch.tsx";
import { Tooltip } from "@fndn/components/tooltip/tooltip.tsx";
import { exampleElement, useComponent } from "../lib/render";
import { thaw, useOptions } from "../lib/store";
import { FW_LABEL, liveModelProps, modelProps, targetsOf, type Example, type Fw, type ModelReport, type Mounted, type Spec } from "../lib/types";
import { usageCode, usagePath } from "../lib/usage";
import Inspector from "./Inspector";
import Examples, { Unavailable } from "./Examples";
import { gated } from "../lib/gate";
import { readySpec } from "../lib/spec-cache";
import { adapterReady, mounters, prepare } from "../lib/warm";
import { useSwapProps } from "../lib/persist";

export type FileRef = { path: string; label: string; src: string };
export type WorkbenchProps = { spec: Spec; files: Record<Fw, FileRef[]>; deps: { name: string; title: string }[];
  /** the invisible static copy that holds the room until the island renders (Astro fallback) */
  placeholder?: boolean };

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** The playground starts from the spec's defaults: index.json gives the
 * content (data, text, behaviour switches, bound values); a look the spec gives a default for
 * (variant, size, tone, shape…) starts at that default, so the stage shows the component as it
 * comes and Usage starts with only the content. */
function fromDefaults(spec: Spec): Example | undefined {
  const p = spec.playground;
  if (!p?.props) return p;
  const props = Object.fromEntries(Object.entries(p.props).filter(([k]) => {
    const d = spec.props[k];
    return !(d && d.type === "enum" && !d.model && d.default !== undefined);
  }));
  return { ...p, props };
}

const Placeholder = () => (
  <div className="flex flex-col gap-3" aria-hidden>
    <div className="h-6" />
    <div className="h-[238px] rounded-card border border-line bg-surface" />
  </div>
);

/* The island is kept across pages (transition:persist on the page): going from one component to
 * another it receives the next page's props and stays mounted, so the stage and the inspector are
 * never taken away and put back, which would read as a flicker and a jump. The router
 * waits for the next component's spec and adapter before it swaps the page (lib/warm.ts), and the
 * island takes the next page's props in the same frame as the swap (lib/persist.ts); if they are
 * still not there, the current one stays on screen until they are, then the whole workbench
 * changes in one commit. */
function Loader(props: Omit<WorkbenchProps, "spec"> & { name: string }) {
  /* the next page's props in the frame of the swap, not a few frames later (lib/persist.ts) */
  const { name, ...rest } = useSwapProps("docs-workbench", props);
  const { fw } = useOptions();
  const shown = useRef<{ spec: Spec; rest: Omit<WorkbenchProps, "spec"> } | null>(null);
  const arrived = readySpec(name);
  if (arrived && adapterReady(arrived, fw)) shown.current = { spec: arrived, rest };
  const [, redraw] = useState(0);
  useEffect(() => {
    const spec = readySpec(name);
    if (spec && adapterReady(spec, fw)) return;
    let alive = true;
    void prepare(name, fw).then(() => { if (alive) redraw((n) => n + 1); });
    return () => { alive = false; };
  }, [name, fw]);
  const view = shown.current;
  return view ? <Workbench key={view.spec.name} spec={view.spec} {...view.rest} /> : <Placeholder />;
}

export default gated(Loader, Placeholder);

function Workbench({ spec, files, deps }: WorkbenchProps) {
  const { fw, dir } = useOptions();
  const available = targetsOf(spec).includes(fw);
  /* React: this component's adapter only, loaded on demand (Vue and Svelte load their own) */
  const ReactComponent = useComponent(fw === "react" && available ? spec.name : "", spec.files?.react?.[0], true);
  useEffect(() => thaw(), []);
  const worstCases = spec.worstCase ?? [];
  const [worst, setWorst] = useState(false);
  const [index, setIndex] = useState(0);
  const ex = Math.min(index, Math.max(0, worstCases.length - 1));
  const start = useMemo(() => fromDefaults(spec), [spec]);
  const example = worst ? worstCases[ex] : start;
  const [overrides, setOverrides] = useState<Record<string, unknown>>({});
  const [replay, setReplay] = useState(0);

  const choose = (to: number) => { if (to === ex) return; setIndex(to); setOverrides({}); };
  const onWorst = (on: boolean) => { setWorst(on); setOverrides({}); };
  const onProp = (name: string, value: unknown) => setOverrides((o) => {
    const next = { ...o };
    if (value === undefined || same(value, example?.props?.[name] ?? spec.props[name]?.default)) delete next[name];
    else next[name] = value;
    return next;
  });
  /* The two-way props with a change event are driven live (lib/types.ts, liveModelProps): the
   * mounted component is controlled by these values, so a page set here travels as it would in an
   * app, and a change made in the component comes back to the panel. Each holds its effective value
   * (the spec's default when neither the example nor the panel gives one), so going back to the
   * default is a change like any other, not a remount. */
  const live = useMemo(() => liveModelProps(spec), [spec]);
  const values: Record<string, unknown> = { ...example?.props, ...overrides };
  for (const k of live) if (values[k] === undefined && spec.props[k]?.default !== undefined) values[k] = spec.props[k].default;
  const onModel: ModelReport = (name, value) => setOverrides((o) => {
    if (same(value, name in o ? o[name] : example?.props?.[name] ?? spec.props[name]?.default)) return o;
    const next = { ...o };
    if (same(value, example?.props?.[name] ?? spec.props[name]?.default)) delete next[name];
    else next[name] = value;
    return next;
  });
  /* mounted Vue and Svelte components keep the callback they were mounted with */
  const reportRef = useRef(onModel);
  reportRef.current = onModel;
  const report = useMemo<ModelReport>(() => (name, value) => reportRef.current(name, value), []);
  /* What still mounts afresh: a two-way prop without a change event (uncontrolled), and a live one
   * taken back to no value at all (a tabs' value cleared in the panel), which only the component's
   * own default can show. */
  const held = JSON.stringify(modelProps(spec).filter((k) => !live.includes(k)).map((k) => overrides[k]));
  const controlled = useRef(new Set<string>());
  const cleared = useRef(0);
  for (const k of live) {
    if (values[k] !== undefined) controlled.current.add(k);
    else if (controlled.current.delete(k)) cleared.current += 1;
  }

  const usage = useMemo(() => usageCode({ spec, fw, example, overrides }), [spec, fw, example, overrides]);
  /* a file's source is fetched when its tab is opened, then kept */
  const [tab, setTab] = useState<string | undefined>(undefined);
  const [, setLoadedCount] = useState(0);
  const active = files[fw].find((f) => f.path === tab);
  useEffect(() => {
    if (!active || SOURCES.has(active.src)) return;
    let alive = true;
    void fetchSource(active.src).then(() => { if (alive) setLoadedCount((n) => n + 1); });
    return () => { alive = false; };
  }, [active]);
  const codeFiles: CodeBlockFile[] = [
    { path: usagePath(fw), label: "Usage", lines: usage.split("\n"), code: usage },
    ...files[fw].map((f) => {
      const code = SOURCES.get(f.src);
      return { path: f.path, label: f.label, lines: code === undefined ? ["…"] : code.replace(/\n$/, "").split("\n"), code: code ?? "" };
    }),
  ];

  return (
    /* phones and tablets: stage, props, code, examples; wide: stage, code and examples, props beside them */
    <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
      <div className="contents xl:flex xl:min-w-0 xl:flex-1 xl:flex-col xl:gap-8">
      <section aria-labelledby="docs-playground" className="order-1 flex min-w-0 flex-col gap-3">
        <h2 id="docs-playground" className="text-md font-semibold text-ink">Playground</h2>
        <div className="min-w-0 overflow-hidden rounded-card border border-line bg-surface" data-docs-stage>
          <div className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-3 py-2">
            {worst
              ? <ExampleSwitch items={worstCases} value={ex} label="Worst case" onChange={choose} />
              : <span className="min-w-0 flex-1 px-1 text-sm text-ink-2 [unicode-bidi:plaintext]">The props change the stage and the code.</span>}
            <div className="ms-auto flex items-center gap-3">
              {worstCases.length > 0 && (
                <Switch size="sm" checked={worst} onCheckedChange={onWorst} data-docs-worst>Worst case</Switch>
              )}
              <Tooltip content="Replay">
                <Button variant="ghost" size="sm" square shape="rounded" muted aria-label="Replay" data-docs-replay icon={<ArrowCounterClockwise data-slot="icon" weight="bold" />} onClick={() => setReplay((n) => n + 1)} />
              </Tooltip>
            </div>
          </div>
          {/* the example's own width (a 560px table) is capped at the stage's, so a wide component
              scrolls inside itself, in its own frame, on a phone */}
          <div className="flex min-h-48 items-center-safe justify-center-safe overflow-x-auto p-4 sm:p-10 [&_[data-docs-fw]]:min-w-0 [&_[data-docs-fw]]:max-w-full [&_[data-docs-fw]>*]:max-w-full" data-docs-mount>
            {!available ? (
              <Unavailable spec={spec} fw={fw} />
            ) : !example ? (
              <EmptyState size="block" icon="file" title="No playground for this component yet" />
            ) : (
              <>
              {/* summoned by a shortcut, it has no trigger of its own: the stage gives it one, or it
                  would stay empty */}
              {spec.props.hotkey && spec.props.open?.model && (
                <Button variant="outline" size="sm" data-docs-opener onClick={() => { setOverrides((o) => ({ ...o, open: true })); setReplay((n) => n + 1); }}>
                  {`Open the ${spec.title.toLowerCase()}`}
                </Button>
              )}
              <Boundary key={`${spec.name}-${worst}-${ex}-${replay}`}>
                {fw !== "react" ? (
                  <Foreign key={`${fw}-${dir}-${held}-${cleared.current}`} fw={fw} spec={spec} example={example} values={values} report={report} dir={dir} />
                ) : !ReactComponent ? null : (
                  <Live key={`${dir}-${held}-${cleared.current}`} spec={spec} example={example} values={values} report={report} dir={dir} />
                )}
              </Boundary>
              </>
            )}
          </div>
        </div>
      </section>

      <section aria-label="Code" className="order-3 min-w-0">
        {available && <CodeBlock files={codeFiles} file={active ? active.path : usagePath(fw)} onFileChange={setTab} maxHeight={480} wrap={false} className="max-w-none" aria-label={`Code, ${FW_LABEL[fw]}`} data-docs-code />}
        <p className={`${available ? "mt-3 " : ""}flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-2`} data-docs-setup>
          <span>Setup:</span>
          <a href="/installation" className="font-medium text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink">Set the project up once</a>
          {deps.length > 0 && <span className="text-ink-3" aria-hidden>·</span>}
          {deps.length > 0 && <span>Built from</span>}
          {deps.map((d) => <a key={d.name} href={`/components/${d.name}`} className="font-medium text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink">{d.title}</a>)}
        </p>
      </section>

      <div className="order-4 min-w-0">
        <Examples spec={spec} fw={fw} dir={dir} available={available} />
      </div>
      </div>

      {/* wide: a right pane of the page, from under the top bar to the bottom of the viewport, with
          its own scroll and the tabs fixed at its top (the page leaves it room: xl:pe-80); narrower:
          below the stage */}
      <aside aria-label="Inspector" className="order-2 min-w-0 xl:fixed xl:top-12 xl:bottom-0 xl:end-0 xl:z-10 xl:w-80 xl:overflow-x-hidden xl:overflow-y-auto xl:overscroll-contain xl:border-s xl:border-line xl:bg-page xl:[scrollbar-gutter:stable]" data-docs-inspector>
        <Inspector key={`${worst}-${ex}`} spec={spec} example={example} overrides={overrides} onProp={onProp} onReset={() => setOverrides({})} />
      </aside>
    </div>
  );
}

/* ── the worst-case switch: segmented while every name fits, else a pager and a select ── */
function ExampleSwitch({ items, value, label, onChange }: { items: Example[]; value: number; label: string; onChange: (i: number) => void }) {
  const slot = useRef<HTMLDivElement>(null);
  const measure = useRef<HTMLDivElement>(null);
  const options = items.map((x, i) => ({ value: String(i), label: x.name }));
  /* before it can measure it guesses from the names, so the bar is never empty; the measure below
   * corrects the guess before the first paint */
  const guess = items.reduce((w, x) => w + x.name.length * 7 + 22, 4) > 520 ? "select" : "segmented";
  const [mode, setMode] = useState<"segmented" | "select">(guess);
  const names = items.map((x) => x.name).join("\u0000");

  useLayoutEffect(() => {
    const s = slot.current, m = measure.current;
    if (!s) return;
    const fit = () => {
      if (!m) return;
      const room = s.clientWidth;
      if (room <= 0) return;
      setMode(m.offsetWidth > room + 0.5 ? "select" : "segmented");
    };
    fit();
    let raf = 0;
    const ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(fit); });
    ro.observe(s);
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, [names]);

  if (items.length <= 1) {
    return <div className="min-w-0 flex-1 px-1 text-sm font-medium text-ink-2">{items[0]?.name ?? ""}</div>;
  }
  return (
    <div ref={slot} className="relative min-w-[min(100%,15rem)] flex-1" data-docs-examples={mode}>
      {/* its width with nothing shortened, against the room there is */}
      <div ref={measure} className="pointer-events-none invisible absolute start-0 top-0 w-max" aria-hidden inert>
        <SegmentedControl size="xs" shape="rounded" options={options} value={String(value)} name="docs-measure" />
      </div>
      <div className="flex items-center gap-2">
        {mode === "select" ? (
          <>
            <Pager count={items.length} page={value} label={`${label}s`} unit={label} onPageChange={onChange} />
            <Select size="sm" variant="subtle" aria-label={label} items={options} value={String(value)} onValueChange={(v) => v != null && onChange(Number(v))} className="min-w-0 max-w-64 flex-1" />
          </>
        ) : (
          <SegmentedControl size="xs" aria-label={label} shape="rounded" options={options} value={String(value)} onValueChange={(v) => onChange(Number(v))} />
        )}
      </div>
    </div>
  );
}

/* ── React: the playground's props and the overrides, the live two-way props controlled ── */
function Live({ spec, example, values, report, dir }: { spec: Spec; example: Example; values: Record<string, unknown>; report: ModelReport; dir: "ltr" | "rtl" }) {
  return (
    <div data-docs-fw="react" className="relative flex items-center justify-center-safe">
      {exampleElement(spec, example, values, dir, report)}
    </div>
  );
}

/* ── Vue and Svelte: mounted by their own runtimes inside this element, as the test harness does ──
 * A change of example, direction, framework or of an uncontrolled two-way prop mounts afresh (as
 * Live is keyed); any other prop, a live two-way one included, reaches the mounted component as an
 * update, so the stage shows what the change does (a status swap, not the entrance again; a page
 * travelled to). `report` hears the two-way props the component changes itself. */
function Foreign({ fw, spec, example, values, report, dir }: { fw: Exclude<Fw, "react">; spec: Spec; example: Example; values: Record<string, unknown>; report: ModelReport; dir: "ltr" | "rtl" }) {
  const el = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef<Mounted | null>(null);
  /* the values the mounted component was given last; the latest wanted, for a mount still loading */
  const given = useRef<Record<string, unknown>>({});
  const wanted = useRef(values);
  wanted.current = values;
  /* mounted before the first paint when lib/warm.ts has loaded the adapter (a page swap), else
   * once it has loaded */
  useLayoutEffect(() => {
    const node = el.current;
    if (!node) return;
    let alive = true;
    const now = fw === "vue" ? mounters.vue?.mountVueNow : mounters.svelte?.mountSvelteNow;
    try {
      const m = now?.(node, spec, example, wanted.current, dir, report);
      if (m) {
        mounted.current = m;
        given.current = wanted.current;
        return () => { m(); mounted.current = null; node.replaceChildren(); };
      }
    } catch (e) { setError((e as Error).message); return; }
    (async () => {
      const mount = fw === "vue" ? (mounters.vue ??= await import("../lib/mount-vue")).mountVue : (mounters.svelte ??= await import("../lib/mount-svelte")).mountSvelte;
      const first = wanted.current;
      const m = await mount(node, spec, example, first, dir, report);
      if (!alive) { m(); return; }
      mounted.current = m;
      given.current = first;
      if (!same(first, wanted.current)) await push(wanted.current);
    })().catch((e: Error) => { if (alive) setError(e.message); });
    return () => { alive = false; mounted.current?.(); mounted.current = null; node.replaceChildren(); };
  }, []);
  /* a prop changed: hand the new values over (a prop taken back to its default is passed as undefined) */
  const push = async (next: Record<string, unknown>) => {
    const m = mounted.current;
    if (!m?.update) return;
    const diff: Record<string, unknown> = {};
    for (const k of new Set([...Object.keys(given.current), ...Object.keys(next)])) if (!same(given.current[k], next[k])) diff[k] = next[k];
    given.current = next;
    if (Object.keys(diff).length) await m.update(diff);
  };
  const key = JSON.stringify(values);
  useEffect(() => { void push(wanted.current); }, [key]);
  if (error) return <EmptyState size="block" icon="file" title="This example could not render" hint={error} role="alert" />;
  return <div ref={el} className="flex items-center justify-center-safe" data-docs-fw={fw} />;
}

const SOURCES = new Map<string, string>();
async function fetchSource(src: string): Promise<void> {
  try { const r = await fetch(src); SOURCES.set(src, r.ok ? await r.text() : `// ${src}: ${r.status}`); } catch (e) { SOURCES.set(src, `// ${src}: ${(e as Error).message}`); }
}

class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) return <EmptyState size="block" icon="file" title="This example could not render" hint={this.state.error.message} role="alert" />;
    return this.props.children;
  }
}
