/* The inspector, all read from the spec: Props (every enum, boolean, string and number prop is
 * editable and changes the stage and Usage at once), Anatomy (pointing at a part outlines it on the
 * stage), Accessibility, Motion and Tokens. */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { tokens } from "@fndn/core/tokens";
import { Button } from "@fndn/components/button/button.tsx";
import { Chip } from "@fndn/components/chip/chip.tsx";
import { Collapsible } from "@fndn/components/collapsible/collapsible.tsx";
import { Input } from "@fndn/components/input/input.tsx";
import { Kbd } from "@fndn/components/kbd/kbd.tsx";
import { SegmentedControl } from "@fndn/components/segmented-control/segmented-control.tsx";
import { Select } from "@fndn/components/select/select.tsx";
import { Switch } from "@fndn/components/switch/switch.tsx";
import { Tabs } from "@fndn/components/tabs/tabs.tsx";
import type { Example, Part, PropSpec, Spec } from "../lib/types";

type Props = { spec: Spec; example?: Example; overrides: Record<string, unknown>; onProp: (name: string, value: unknown) => void; onReset: () => void };

/* the tab last opened stays open from one example to the next */
let lastTab = "props";

export default function Inspector(props: Props) {
  const { spec } = props;
  const [tab, setTab] = useState(lastTab);
  return (
    <Tabs
      aria-label="Inspector"
      headerClass="sticky top-12 z-10 bg-page border-b border-line-soft py-1.5 xl:top-0 xl:px-3"
      value={tab}
      onValueChange={(v) => { lastTab = v; setTab(v); }}
      className="min-w-0"
      items={[
        { value: "props", label: "Props", content: <PropsPanel {...props} /> },
        { value: "anatomy", label: "Anatomy", content: <AnatomyPanel spec={spec} /> },
        { value: "a11y", label: <abbr title="Accessibility" className="no-underline">A11y</abbr>, content: <A11yPanel spec={spec} /> },
        { value: "motion", label: "Motion", content: <MotionPanel spec={spec} /> },
        { value: "tokens", label: "Tokens", content: <TokensPanel spec={spec} /> },
      ]}
    />
  );
}

/* ── shared bits ─────────────────────────────────────────── */
const Hint = ({ children }: { children: ReactNode }) => <p className="text-xs text-ink-2 [unicode-bidi:plaintext]">{children}</p>;
const Empty = ({ children }: { children: ReactNode }) => <p className="pt-3 text-sm text-ink-2 xl:px-4">{children}</p>;
const H = ({ children }: { children: ReactNode }) => <h3 className="pt-3 text-xs font-semibold text-ink first:pt-0">{children}</h3>;
const Panel = ({ children, ...rest }: { children: ReactNode } & Record<string, unknown>) => <div className="flex flex-col gap-3 pt-3 pb-6 xl:px-4" {...rest}>{children}</div>;
const Rows = ({ children }: { children: ReactNode }) => <ul className="flex flex-col divide-y divide-line-soft border-y border-line-soft">{children}</ul>;
const Text = ({ children }: { children: ReactNode }) => <span className="text-xs text-ink-2 [unicode-bidi:plaintext]">{children}</span>;

/* ── Props ───────────────────────────────────────────────── */
const editable = (p: PropSpec) => p.type === "enum" || p.type === "boolean" || p.type === "string" || p.type === "number";
const typeLabel = (p: PropSpec) => p.ts ? p.ts : p.type === "enum" ? (p.values ?? []).join(" | ") : p.type === "array" && p.items ? `{ ${Object.entries(p.items).map(([a, b]) => `${a}: ${b}`).join(", ")} }[]` : p.type;

/* a default short enough to sit beside the name; a longer one is in the prop's details */
const shortDefault = (p: PropSpec): string | null => {
  if (p.default === undefined) return null;
  const s = typeof p.default === "string" ? p.default : JSON.stringify(p.default);
  return s.length <= 12 ? s : null;
};

/* One line per prop: its name (with the default beside it, or marked in a select's list), and its
 * control at the end. The name is a disclosure: its description, type and default open under the
 * row on demand, so the inspector never outweighs the stage. */
function PropsPanel({ spec, example, overrides, onProp, onReset }: Props) {
  const entries = Object.entries(spec.props);
  const [generation, setGeneration] = useState(0);
  const markupOnly = example?.frameworks === false;
  if (!entries.length) return <Empty>This component has no props.</Empty>;
  return (
    <Panel data-docs-panel="props">
      <div className="flex items-center justify-between gap-2">
        <Hint>{markupOnly ? "This example needs rich children: its props cannot be edited here." : "Changes apply to the stage and to Usage. A name opens its details."}</Hint>
        <Button size="xs" shape="rounded" data-docs-reset disabled={!Object.keys(overrides).length} onClick={() => { onReset(); setGeneration((g) => g + 1); }}>Reset</Button>
      </div>
      <div className="flex flex-col divide-y divide-line-soft border-y border-line-soft" key={generation}>
        {entries.map(([name, p]) => {
          const value = name in overrides ? overrides[name] : example?.props?.[name] ?? p.default;
          const canEdit = editable(p) && !markupOnly;
          /* a select marks its default in its own list and a text field shows it as its
             placeholder, so the name keeps the room it needs and the field stays on its line */
          const def = canEdit && wide(name, p) ? null : shortDefault(p);
          const text = canEdit && (p.type === "string" || p.type === "number");
          return (
            /* the disclosure's root is display: contents, so its trigger and the control share
               the line and its region takes a line of its own under both; a control that does not
               fit beside the name and its default moves under them, nothing is cut. Each line is
               32px by what it holds (the control's box below, the name's 3px margins), not by a
               minimum on the row: a minimum stretches a lone line and stops stretching it once
               the region adds a second line, and the name would move up as its details open */
            <div key={name} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1 [&>[data-slot=collapsible]>[data-slot=collapsible-content]]:order-last [&>[data-slot=collapsible]>[data-slot=collapsible-content]]:basis-full" data-prop={name}>
              <Collapsible
                variant="inline" caret="start" className="contents"
                triggerClass="my-[3px] font-mono text-xs text-ink"
                label={name}
                meta={def === null ? undefined : <span className="font-mono text-2xs" title="Default">{def}</span>}
                detail={p.description}
                data-docs-prop-details
              >
                <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 pt-1 pb-2" data-docs-prop-info>
                  <dt className="text-2xs text-ink-2">Type</dt>
                  <dd><code className="font-mono text-2xs break-words text-ink-2 [unicode-bidi:plaintext]">{typeLabel(p)}</code></dd>
                  {p.default !== undefined && <><dt className="text-2xs text-ink-2">Default</dt><dd><code className="font-mono text-2xs break-words text-ink-2">{JSON.stringify(p.default)}</code></dd></>}
                  {p.model && <><dt className="text-2xs text-ink-2">Bound</dt><dd><Text>two-way: v-model in Vue, bind: in Svelte</Text></dd></>}
                </dl>
              </Collapsible>
              {/* a field (select, text) takes the room left beside the name, within bounds; a
                  segmented control or a switch keeps its own width. A text field may narrow to
                  5.5rem beside a long name (its text scrolls); a select keeps 8rem, so the name
                  of its choice is never cut */}
              <div className={`ms-auto flex min-h-8 items-center justify-end ${canEdit && wide(name, p) ? `max-w-40 ${text ? "flex-[1_0_5.5rem]" : "flex-[1_0_8rem]"} *:w-full` : "max-w-full"}`}>
                {canEdit ? <Control name={name} p={p} value={value} onChange={(v) => onProp(name, v)} /> : <code className="font-mono text-2xs text-ink-2">{p.type}</code>}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* An enum is a segmented control while its options fit on the line beside the name and its
 * default (the pane is 320px: about 270px of row), else a select. Widths are estimates from the
 * text lengths: 7.2px a character of the mono name, 6.6 of the default, 6.5 of an option. */
const ROW = 270;
const nameWidth = (name: string, def: string | null) => 34 + name.length * 7.2 + (def === null ? 0 : 8 + def.length * 6.6);
const segmentedFits = (name: string, p: PropSpec) => {
  const values = p.values ?? [];
  return values.length <= 4 && nameWidth(name, shortDefault(p)) + 12 + values.reduce((w, v) => w + v.length * 6.5 + 16, 4) <= ROW;
};
/* the controls drawn as a field (a select, a text or number input) */
const wide = (name: string, p: PropSpec) => p.type === "string" || p.type === "number" || (p.type === "enum" && !segmentedFits(name, p));

function Control({ name, p, value, onChange }: { name: string; p: PropSpec; value: unknown; onChange: (v: unknown) => void }) {
  const label = `Prop ${name}`;
  if (p.type === "boolean") {
    return <Switch size="sm" label={label} checked={!!value} onCheckedChange={onChange} />;
  }
  if (p.type === "enum") {
    const values = p.values ?? [];
    const v = value === undefined || value === null ? "" : String(value);
    return segmentedFits(name, p)
      ? <SegmentedControl size="xs" aria-label={label} shape="rounded" options={values} value={v} onValueChange={onChange} />
      : <Select size="sm" variant="subtle" aria-label={label} items={values.map((x) => ({ value: x, label: x, meta: x === p.default ? "default" : undefined }))} value={v || null} placeholder="auto" onValueChange={(x) => x != null && onChange(x)} />;
  }
  return <TextControl label={label} number={p.type === "number"} value={value} placeholder={p.default !== undefined ? String(p.default) : p.type} onChange={onChange} />;
}

/* typing is debounced (250ms), so the stage does not re-render at every key */
function TextControl({ label, number, value, placeholder, onChange }: { label: string; number: boolean; value: unknown; placeholder: string; onChange: (v: unknown) => void }) {
  const [text, setText] = useState(value === undefined || value === null ? "" : String(value));
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  /* a two-way prop the component changed itself (a carousel's page turned by its Next button) */
  useEffect(() => {
    const shown = number ? (text === "" ? undefined : Number(text)) : text;
    if (shown !== value && !(text === "" && (value === undefined || value === null))) setText(value === undefined || value === null ? "" : String(value));
  }, [value]);
  return (
    <Input
      size="sm" variant="subtle" type={number ? "number" : "text"} aria-label={label} spellCheck={false} autoComplete="off" placeholder={placeholder}
      value={text}
      onChange={(e) => {
        const next = (e.target as HTMLInputElement).value;
        setText(next);
        clearTimeout(timer.current);
        timer.current = window.setTimeout(() => onChange(number ? (next === "" ? undefined : Number(next)) : next), 250);
      }}
    />
  );
}

/* ── Anatomy ─────────────────────────────────────────────── */
const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/_/g, "-").toLowerCase();
/** The slot a part carries in the final shape of a component. */
export const slotOf = (name: string, part: string) => (part === "root" ? name : `${name}-${kebab(part)}`);

/** The elements of a part on the stage: by `data-slot`, then by the block's own attribute (a part
 * another component renders), then, for a component not yet in its final shape, by its old class. */
export function partsOf(stage: ParentNode, name: string, a: Part): Element[] {
  const part = kebab(a.part);
  const selectors = [`[data-slot="${slotOf(name, a.part)}"]`, `[data-${name}="${part}"]`];
  for (const sel of selectors) { const hit = stage.querySelectorAll(sel); if (hit.length) return [...hit]; }
  if (a.class && /^[\w-]+$/.test(a.class)) return [...stage.querySelectorAll(`.${a.class}`)];
  return [];
}

type Box = { x: number; y: number; w: number; h: number };

function AnatomyPanel({ spec }: { spec: Spec }) {
  const parts = spec.anatomy ?? [];
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [count, setCount] = useState<Record<string, number>>({});
  const show = (a: Part | null) => {
    const stage = document.querySelector("[data-docs-mount]");
    if (!a || !stage) { setBoxes([]); return; }
    const found = partsOf(stage, spec.name, a);
    setCount((c) => ({ ...c, [a.part]: found.length }));
    setBoxes(found.map((n) => n.getBoundingClientRect()).filter((r) => r.width || r.height).map((r) => ({ x: r.left, y: r.top, w: r.width, h: r.height })));
  };
  /* the outline is a snapshot: scrolling or resizing drops it */
  useEffect(() => {
    if (!boxes.length) return;
    const drop = () => setBoxes([]);
    addEventListener("scroll", drop, { capture: true, passive: true });
    addEventListener("resize", drop);
    return () => { removeEventListener("scroll", drop, { capture: true }); removeEventListener("resize", drop); };
  }, [boxes.length]);
  useEffect(() => () => setBoxes([]), []);

  if (!parts.length) return <Empty>No anatomy in the spec.</Empty>;
  const events = Object.entries(spec.events ?? {}).filter(([, v]) => !/^plain HTML only/i.test(v));
  return (
    <Panel data-docs-panel="anatomy">
      <Hint>Point at a part to outline it on the stage.</Hint>
      <Rows>
        {parts.map((a) => (
          <li
            key={a.part}
            tabIndex={0}
            data-docs-part={a.part}
            className="-mx-2 flex flex-col gap-1 rounded-control py-2.5 px-2 outline-none motion-colors-fast focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent hover:bg-hover"
            onPointerEnter={() => show(a)}
            onPointerLeave={() => show(null)}
            onFocus={() => show(a)}
            onBlur={() => show(null)}
          >
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-sm font-medium text-ink">{a.part}</span>
              {a.element && <code className="font-mono text-2xs text-ink-2">{`<${a.element}>`}</code>}
              {a.optional && <Chip>optional</Chip>}
              {a.repeat && <Chip>repeats</Chip>}
              {count[a.part] === 0 && <span className="ms-auto text-2xs text-ink-2">not in this example</span>}
            </span>
            <code className="font-mono text-2xs break-all text-ink-2">{`data-slot="${slotOf(spec.name, a.part)}"`}</code>
            {a.description && <Text>{a.description}</Text>}
          </li>
        ))}
      </Rows>
      {(Object.keys(spec.slots ?? {}).length > 0 || events.length > 0) && (
        <>
          <H>Slots and events</H>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5">
            {Object.entries(spec.slots ?? {}).map(([k, v]) => [<dt key={`s${k}`}><code className="font-mono text-2xs text-ink">{`slot ${k}`}</code></dt>, <dd key={`d${k}`}><Text>{v}</Text></dd>])}
            {events.map(([k, v]) => [<dt key={`e${k}`}><code className="font-mono text-2xs text-ink">{k}</code></dt>, <dd key={`v${k}`}><code className="font-mono text-2xs break-words text-ink-2">{v}</code></dd>])}
          </dl>
        </>
      )}
      {spec.states?.length ? (
        <>
          <H>States</H>
          <div className="flex flex-wrap gap-1.5">{spec.states.map((s) => <Chip key={s}>{s}</Chip>)}</div>
        </>
      ) : null}
      {boxes.length > 0 && createPortal(
        <div className="pointer-events-none fixed inset-0 z-popup" aria-hidden data-docs-outline>
          {boxes.map((b, i) => (
            <div key={i} className="absolute rounded-[2px] outline-2 outline-offset-1 outline-accent bg-accent-tint/40" style={{ left: b.x, top: b.y, width: b.w, height: b.h }} />
          ))}
        </div>,
        document.body,
      )}
    </Panel>
  );
}

/* ── Accessibility ───────────────────────────────────────── */
const KEY = /^(Enter|Space|Escape|Esc|Tab|Shift\+Tab|Shift|Home|End|PageUp|PageDown|Backspace|Delete|ArrowDown|ArrowUp|ArrowLeft|ArrowRight|Arrow keys|Arrows|⌘\S*|Ctrl\+\S+|Cmd\+\S+|[A-Z])$/;
/** "Enter / Space / ArrowDown on the trigger open the list" → keys [Enter, Space, ArrowDown], rest. */
function splitKeys(line: string): { keys: string[]; rest: string } {
  const words = line.split(/\s+/);
  const keys: string[] = [];
  let i = 0;
  for (; i < words.length; i++) {
    const w = words[i]!.replace(/[,;:]$/, "");
    if (w === "/" || w === "or" || w === "+") continue;
    if (KEY.test(w)) { keys.push(w); continue; }
    break;
  }
  if (!keys.length) return { keys: [], rest: line };
  return { keys, rest: words.slice(i).join(" ") };
}

function A11yPanel({ spec }: { spec: Spec }) {
  const a = spec.a11y;
  if (!a) return <Empty>No accessibility notes in the spec.</Empty>;
  return (
    <Panel data-docs-panel="a11y">
      {a.role && (<><H>Role</H><code className="font-mono text-xs text-ink">{a.role}</code></>)}
      {a.keyboard?.length ? (
        <>
          <H>Keyboard</H>
          <Rows>
            {a.keyboard.map((line, i) => {
              const { keys, rest } = splitKeys(line);
              return (
                <li key={i} className="flex flex-col gap-1.5 py-2.5">
                  {keys.length > 0 && <span className="flex flex-wrap gap-1">{keys.map((k) => <Kbd key={k} keys={[k]} />)}</span>}
                  <Text>{keys.length ? rest : line}</Text>
                </li>
              );
            })}
          </Rows>
        </>
      ) : null}
      {a.notes?.length ? (
        <>
          <H>Notes</H>
          <ul className="flex list-disc flex-col gap-1.5 ps-4 marker:text-ink-3">{a.notes.map((n, i) => <li key={i}><Text>{n}</Text></li>)}</ul>
        </>
      ) : null}
    </Panel>
  );
}

/* ── Motion ──────────────────────────────────────────────── */
const tokenValue = (group: string, name: string): unknown => (tokens as unknown as Record<string, Record<string, unknown>>)[group]?.[name];
const cssVar = (group: string, name: string) => `--fndn-${group === "color" ? "" : `${group}-`}${name}`;

function MotionPanel({ spec }: { spec: Spec }) {
  const used = (spec.tokens ?? []).filter((t) => /^(duration|easing|motion)\./.test(t));
  return (
    <Panel data-docs-panel="motion">
      {spec.motion?.length
        ? <ul className="flex list-disc flex-col gap-1.5 ps-4 marker:text-ink-3">{spec.motion.map((m, i) => <li key={i}><Text>{m}</Text></li>)}</ul>
        : <Empty>The spec describes no motion.</Empty>}
      {used.length > 0 && (
        <>
          <H>Timing tokens</H>
          <Rows>
            {used.map((t) => {
              const [g = "", n = ""] = t.split(".");
              return <TokenRow key={t} name={cssVar(g, n)} value={String(tokenValue(g, n) ?? "?")} />;
            })}
          </Rows>
        </>
      )}
      <Hint>The view options in the top bar slow every animation down; Reduced motion applies the reduced values.</Hint>
    </Panel>
  );
}

/* ── Tokens ──────────────────────────────────────────────── */
function TokenRow({ name, value, preview, unknown }: { name: string; value?: string; preview?: ReactNode; unknown?: boolean }) {
  return (
    <li className="flex min-h-9 items-center gap-2 py-1.5">
      {preview}
      <code className="min-w-0 flex-1 font-mono text-2xs break-all text-ink">{name}</code>
      {value !== undefined && <code className="shrink-0 font-mono text-2xs text-ink-2">{value}</code>}
      {unknown && <Chip tone="red">unknown</Chip>}
    </li>
  );
}

function TokensPanel({ spec }: { spec: Spec }) {
  const list = spec.tokens ?? [];
  if (!list.length) return <Empty>The spec lists no tokens.</Empty>;
  const groups = new Map<string, string[]>();
  for (const t of list) { const [g = "", n = ""] = t.split("."); (groups.get(g) ?? groups.set(g, []).get(g)!).push(n); }
  return (
    <Panel data-docs-panel="tokens">
      <Hint>The tokens this component may use. Colours show light and dark.</Hint>
      {[...groups].map(([g, names]) => (
        <div key={g} className="flex flex-col gap-2">
          <H>{g}</H>
          <Rows>
            {names.map((n) => {
              const v = tokenValue(g, n);
              const pair = typeof v === "object" && v ? (v as { light: string; dark: string }) : null;
              const name = cssVar(g, n);
              let preview: ReactNode = null;
              /* token values shown as data: the swatch paints the value the token holds in each theme */
              if (g === "color" && pair) preview = (
                <span className="flex shrink-0 gap-1" title={`light ${pair.light}\ndark ${pair.dark}`}>
                  <span className="size-4 rounded-[4px] shadow-hairline" style={{ background: pair.light }} /><span className="size-4 rounded-[4px] shadow-hairline" style={{ background: pair.dark }} />
                </span>
              );
              else if (g === "shadow") preview = <span className="size-4 shrink-0 rounded-chip bg-surface" style={{ boxShadow: `var(${name})` }} />;
              else if (g === "radius") preview = <span className="size-4 shrink-0 border border-line-strong bg-inset" style={{ borderRadius: `var(${name})` }} />;
              const shown = g === "color" || g === "shadow" ? undefined : String(pair ? pair.light : v ?? "");
              return <TokenRow key={n} name={name} value={shown} preview={preview} unknown={v === undefined} />;
            })}
          </Rows>
        </div>
      ))}
    </Panel>
  );
}
