/* The motion foundation: the named timings and their motion-<what>-<timing> utilities, then the
 * durations, easings and motion values, each with a live sample. A sample moves a dot along a track
 * when its Play button is pressed (and back on the next press); nothing plays on first paint. The
 * samples read the tokens, so the animation speed and reduced motion of the view options apply. */
import { useState, type CSSProperties, type ReactNode } from "react";
import { Play } from "@phosphor-icons/react";
import { Button } from "@fndn/components/button/button.tsx";
import { SegmentedControl } from "@fndn/components/segmented-control/segmented-control.tsx";
import { Select } from "@fndn/components/select/select.tsx";
import type { Row, Timing } from "../lib/foundations";

/* written out whole so Tailwind generates each one */
const TRANSFORM: Record<string, string> = {
  fast: "motion-transform-fast", base: "motion-transform-base", slow: "motion-transform-slow",
  press: "motion-transform-press", move: "motion-transform-move", glide: "motion-transform-glide",
  reveal: "motion-transform-reveal", popup: "motion-transform-popup", tooltip: "motion-transform-tooltip",
  enter: "motion-transform-enter", "fast-out": "motion-transform-fast-out", "base-out": "motion-transform-base-out", "slow-out": "motion-transform-slow-out",
};
const WHAT: [what: string, props: string][] = [
  ["colors", "color, background, border, outline, text-decoration, fill, stroke"],
  ["opacity", "opacity"],
  ["shadow", "box-shadow"],
  ["transform", "transform, translate, scale, rotate"],
  ["filter", "filter, backdrop-filter"],
  ["size", "width, height, grid tracks"],
  ["radius", "border-radius"],
];

/** A track with a dot that crosses it when `on`. */
function Track({ on, className = "", style }: { on: boolean; className?: string; style?: CSSProperties }) {
  return (
    <span className="relative block h-5 w-32 shrink-0 rounded-pill bg-inset shadow-hairline" aria-hidden>
      <span className="absolute inset-y-1 start-1 end-4">
        <span
          data-docs-dot
          className={`block h-3 w-full ${on ? "translate-x-full rtl:-translate-x-full" : "translate-x-0"} ${className}`}
          style={style}
        >
          <span className="block size-3 rounded-full bg-accent" />
        </span>
      </span>
    </span>
  );
}

function Sample({ label, className, style }: { label: string; className?: string; style?: CSSProperties }) {
  const [on, setOn] = useState(false);
  return (
    <span className="flex items-center gap-3" data-docs-sample={label}>
      <Button size="xs" shape="rounded" square muted aria-label={`Play ${label}`} aria-pressed={on} icon={<Play data-slot="icon" weight="fill" />} onClick={() => setOn((v) => !v)} />
      <Track on={on} className={className} style={style} />
    </span>
  );
}

/* a token name is one word: it never breaks mid-name (the table scrolls sideways instead) */
const Code = ({ children, muted }: { children: ReactNode; muted?: boolean }) => <code className={`whitespace-nowrap font-mono text-xs ${muted ? "text-ink-2" : "text-ink"}`}>{children}</code>;
const Th = ({ children, end }: { children?: ReactNode; end?: boolean }) => <th scope="col" className={`border-b border-line px-3 py-2 text-start text-xs font-medium text-ink-2 ${end ? "w-0" : ""}`}>{children}</th>;
const Td = ({ children, muted }: { children: ReactNode; muted?: boolean }) => <td className={`border-b border-line-soft px-3 py-2.5 align-middle text-sm ${muted ? "text-ink-2" : "text-ink"} [unicode-bidi:plaintext]`}>{children}</td>;
function Table({ head, children, label }: { head: ReactNode; children: ReactNode; label: string }) {
  return (
    <div className="overflow-x-auto overscroll-x-contain rounded-card border border-line bg-surface" role="region" aria-label={label} tabIndex={0}>
      <table className="w-full min-w-[40rem] border-collapse">
        <thead><tr>{head}</tr></thead>
        <tbody className="[&>tr:last-child>td]:border-b-0">{children}</tbody>
      </table>
    </div>
  );
}
const H2 = ({ id, children }: { id: string; children: ReactNode }) => <h2 id={id} className="mt-12 mb-2 text-lg font-semibold tracking-tight text-ink first:mt-0">{children}</h2>;
const P = ({ children }: { children: ReactNode }) => <p className="mb-4 max-w-[46rem] text-sm leading-relaxed text-ink-2">{children}</p>;

function curve(value: string): string {
  const c = (value.match(/[\d.]+/g) ?? []).map(Number);
  return c.length === 4 ? `M0,40 C${c[0]! * 64},${40 - c[1]! * 40} ${c[2]! * 64},${40 - c[3]! * 40} 64,0` : "M0,40 L64,0";
}

export type MotionProps = { timings: Timing[]; timingsNote: string; durations: Row[]; easings: Row[]; values: Row[]; durationNote: string };

export default function MotionFoundation({ timings, timingsNote, durations, easings, values, durationNote }: MotionProps) {
  const [what, setWhat] = useState("colors");
  return (
    <div>
      <section aria-labelledby="timings">
        <H2 id="timings">Timings</H2>
        <P>{timingsNote}</P>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="text-sm text-ink-2" aria-hidden>Utility for</span>
          {/* the seven names never fit a phone's row, and a name of a choice is never cut: the
           * segmented control where it fits whole, a select below that */}
          <div className="hidden sm:block">
            <SegmentedControl size="xs" aria-label="Utility for" shape="rounded" options={WHAT.map(([w]) => w)} value={what} onValueChange={setWhat} data-docs-what />
          </div>
          <div className="sm:hidden">
            <Select size="xs" variant="outline" aria-label="Utility for" items={WHAT.map(([w]) => w)} value={what} onValueChange={(v) => v != null && setWhat(v)} className="w-32" />
          </div>
        </div>
        <Table label="Timings" head={<><Th>Timing</Th><Th>Duration</Th><Th>Easing</Th><Th>Utility</Th><Th end><span className="sr-only">Sample</span></Th></>}>
          {timings.map((t) => (
            <tr key={t.name} data-docs-timing={t.name}>
              <Td><Code>{t.name}</Code></Td>
              <Td><Code>{`duration.${t.duration}`}</Code> <Code muted>{t.durationValue}</Code></Td>
              <Td>{t.easing === t.easingValue ? <Code>{t.easing}</Code> : <><Code>{`easing.${t.easing}`}</Code></>}</Td>
              <Td><Code>{`motion-${what}-${t.name}`}</Code></Td>
              <Td><Sample label={`timing ${t.name}`} className={TRANSFORM[t.name]} /></Td>
            </tr>
          ))}
        </Table>
      </section>

      <section aria-labelledby="utilities">
        <H2 id="utilities">The motion utilities</H2>
        <P>
          <Code>{"motion-<what>-<timing>"}</Code> transitions one family of properties with a named timing. Several combine on one
          element (<Code>motion-colors-fast motion-transform-press</Code>): each sets its own part of the transition.
        </P>
        <ul className="flex max-w-[46rem] flex-col divide-y divide-line-soft border-y border-line-soft" role="list">
          {WHAT.map(([w, props]) => (
            <li key={w} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5">
              <Code>{`motion-${w}-*`}</Code>
              <span className="text-sm text-ink-2">{props}</span>
            </li>
          ))}
          <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5">
            <Code>{"motion-also-[…]"}</Code>
            <span className="text-sm text-ink-2">any other transition, added to the ones above (display for an exit, for example)</span>
          </li>
        </ul>
      </section>

      <section aria-labelledby="durations">
        <H2 id="durations">Durations</H2>
        <P>{durationNote}</P>
        <Table label="Durations" head={<><Th>Token</Th><Th>Value</Th><Th>Reduced</Th><Th>Use</Th><Th end><span className="sr-only">Sample</span></Th></>}>
          {durations.map((d) => (
            <tr key={d.name}>
              <Td><Code>{`--fndn-duration-${d.name}`}</Code></Td>
              <Td><Code>{d.value}</Code></Td>
              <Td><Code muted>{d.reduced ?? "same"}</Code></Td>
              <Td muted>{d.description}</Td>
              <Td><Sample label={`duration ${d.name}`} style={{ transition: `transform var(--fndn-duration-${d.name}) var(--fndn-easing-out-strong)` }} /></Td>
            </tr>
          ))}
        </Table>
      </section>

      <section aria-labelledby="easings">
        <H2 id="easings">Easings</H2>
        <Table label="Easings" head={<><Th>Token</Th><Th>Curve</Th><Th>Use</Th><Th end><span className="sr-only">Sample</span></Th></>}>
          {easings.map((e) => (
            <tr key={e.name}>
              <Td><span className="flex flex-col gap-0.5"><Code>{`--fndn-easing-${e.name}`}</Code><Code muted>{e.value}</Code></span></Td>
              <Td>
                <svg viewBox="-2 -2 68 44" className="h-10 w-16 overflow-visible rtl:-scale-x-100" aria-hidden>
                  <path d="M0,40 L64,0" className="fill-none stroke-line-strong" strokeWidth={1} strokeDasharray="2 3" />
                  <path d={curve(e.value)} className="fill-none stroke-accent" strokeWidth={2} />
                </svg>
              </Td>
              <Td muted>{e.description}</Td>
              <Td><Sample label={`easing ${e.name}`} style={{ transition: `transform var(--fndn-duration-enter) var(--fndn-easing-${e.name})` }} /></Td>
            </tr>
          ))}
        </Table>
      </section>

      <section aria-labelledby="values">
        <H2 id="values">Motion values</H2>
        <Table label="Motion values" head={<><Th>Token</Th><Th>Value</Th><Th>Reduced</Th><Th>Use</Th></>}>
          {values.map((v) => (
            <tr key={v.name}>
              <Td><Code>{`--fndn-motion-${v.name}`}</Code></Td>
              <Td><Code>{v.value}</Code></Td>
              <Td><Code muted>{v.reduced ?? "same"}</Code></Td>
              <Td muted>{v.description}</Td>
            </tr>
          ))}
        </Table>
      </section>
    </div>
  );
}
