"use client";
import { Collapsible } from "@ark-ui/react/collapsible";
import { isValidElement, useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { glide } from "../lib/glide";
import { trackModality } from "../lib/modality";
import { Button } from "../button/button";
import { collapsible } from "../collapsible/collapsible.recipe";
import { EntityChip } from "../entity-chip/entity-chip";
import { recommendationCard } from "./recommendation-card.recipe";
import { ValuePill } from "../value-pill/value-pill";

const r = recommendationCard();
const c = collapsible();

export type RecommendationTone = "neutral" | "green" | "orange" | "red" | "accent";
/** A piece of an option's body: text, an entity chip, a value pill or emphasised text. */
export type RecommendationSegment =
  | string
  | { entity: string; color?: string }
  | { value: string; tone?: RecommendationTone }
  | { strong: string };
export type RecommendationOption = {
  key: string;
  /** Plain text, segments (JSON-friendly), or any React node. */
  body: string | RecommendationSegment[] | ReactNode;
  short: string;
  /** lit bars, 0–3 */
  signal: number;
  tone: RecommendationTone;
  label: string;
  cta: string;
  ctaVariant?: "accent" | "primary";
};
export type RecommendationLabels = { alternatives: string; otherOptions: string; accepted: string };
const DEFAULT_LABELS: RecommendationLabels = { alternatives: "Alternatives", otherOptions: "Other options", accepted: "Accepted" };

export type RecommendationCardProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> & {
  title: string;
  options: RecommendationOption[];
  selected?: number;
  defaultSelected?: number;
  onSelectedChange?: (index: number) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  accepted?: boolean;
  defaultAccepted?: boolean;
  onAcceptedChange?: (accepted: boolean) => void;
  onSelect?: (index: number) => void;
  onAccept?: (option: RecommendationOption) => void;
  labels?: Partial<RecommendationLabels>;
};

function Segment({ segment }: { segment: RecommendationSegment }) {
  if (typeof segment === "string") return <>{segment}</>;
  if ("entity" in segment) {
    return <EntityChip name={segment.entity} color={segment.color} />;
  }
  if ("value" in segment) return <ValuePill tone={segment.tone ?? "neutral"}>{segment.value}</ValuePill>;
  return <span data-slot="recommendation-card-strong" className={r.strong()}>{segment.strong}</span>;
}

function Body({ body }: { body: RecommendationOption["body"] }) {
  if (Array.isArray(body) && !isValidElement(body[0])) return <>{(body as RecommendationSegment[]).map((s, i) => <Segment key={i} segment={s} />)}</>;
  return <>{body as ReactNode}</>;
}

function Meter({ signal, tone }: { signal: number; tone: RecommendationTone }) {
  return (
    <span data-slot="recommendation-card-meter" className={r.meter({ tone })} aria-hidden>
      {[0, 1, 2].map((bar) => <span key={bar} data-slot="recommendation-card-meter-bar" className={r.meterBar({ on: bar < signal })} />)}
    </span>
  );
}

/** Agent suggestion with a confidence meter and actions. */
export function RecommendationCard({
  title, options, selected, defaultSelected = 0, onSelectedChange, open, defaultOpen = false, onOpenChange,
  accepted, defaultAccepted = false, onAcceptedChange, onSelect, onAccept, labels, className, ...rest
}: RecommendationCardProps) {
  const t = { ...DEFAULT_LABELS, ...labels };
  const [innerSel, setInnerSel] = useState(defaultSelected);
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const [innerAcc, setInnerAcc] = useState(defaultAccepted);
  const sel = Math.min(Math.max(selected ?? innerSel, 0), Math.max(options.length - 1, 0));
  const isOpen = open ?? innerOpen;
  const isAccepted = accepted ?? innerAcc;
  const list = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLSpanElement>(null);
  useEffect(() => trackModality(), []);
  /* one gliding highlight under the alternatives (the drawer exists only with more than one option) */
  const many = options.length > 1;
  useEffect(() => {
    if (!many || !list.current || !layer.current) return;
    return glide(list.current, layer.current, { rows: "[data-slot=recommendation-card-alt]:not([hidden])", follow: "hover" });
  }, [many]);
  /* after a pick the chosen row leaves the list: keep focus at the same place in it */
  const refocus = useRef<number | null>(null);
  useEffect(() => {
    const at = refocus.current;
    refocus.current = null;
    if (at === null || !list.current) return;
    const visible = Array.from(list.current.querySelectorAll<HTMLElement>("[data-slot=recommendation-card-alt]:not([hidden])"));
    visible[Math.min(at, visible.length - 1)]?.focus({ preventScroll: true });
  }, [sel]);

  const active = options[sel];
  if (!active) return null;

  const setAccepted = (next: boolean) => { if (accepted === undefined) setInnerAcc(next); if (next !== isAccepted) onAcceptedChange?.(next); };
  const select = (i: number, position: number, button: HTMLElement) => {
    if (document.activeElement === button) refocus.current = position;
    if (selected === undefined) setInnerSel(i);
    setAccepted(false);
    onSelectedChange?.(i);
    onSelect?.(i);
  };
  const toggleOpen = (n: boolean) => { if (open === undefined) setInnerOpen(n); onOpenChange?.(n); };
  const accept = () => { setAccepted(true); onAccept?.(active); };
  let position = 0;

  const card = (
    <div data-slot="recommendation-card" className={r.base({ class: className })} {...rest}>
      <span data-slot="recommendation-card-status" className={r.status()} role="status">{isAccepted ? t.accepted : ""}</span>
      <div data-slot="recommendation-card-body" className={r.body()}>
        <span data-slot="recommendation-card-title" className={r.title()}>{title}</span>
        <div data-slot="recommendation-card-texts" className={r.texts()}>
          {options.map((o, i) => (
            <p key={o.key} data-slot="recommendation-card-text" className={r.text({ active: i === sel })} aria-hidden={i === sel ? undefined : true}>
              <Body body={o.body} />
            </p>
          ))}
        </div>
      </div>
      {many && (
        <Collapsible.Content data-recommendation-card="drawer" data-slot="collapsible-content" className={c.content({ class: r.drawer() })}>
          <div data-slot="collapsible-body" className={c.body()}>
            <div data-slot="recommendation-card-drawer-list" className={r.drawerList()} ref={list}>
              <span ref={layer} data-slot="recommendation-card-highlight" className={r.highlight()} aria-hidden="true" />
              <p data-slot="recommendation-card-drawer-label" className={r.drawerLabel()}>{t.otherOptions}</p>
              {options.map((o, i) => {
                const at = i === sel ? -1 : position++;
                return (
                  <button key={o.key} type="button" data-slot="recommendation-card-alt" className={r.alt()} hidden={i === sel} onClick={(e) => select(i, at, e.currentTarget)}>
                    <Meter signal={o.signal} tone={o.tone} />
                    <span data-slot="recommendation-card-alt-short" className={r.altShort()}>{o.short}</span>
                    <span data-slot="recommendation-card-alt-label" className={r.altLabel()}>{o.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Collapsible.Content>
      )}
      <div data-slot="recommendation-card-footer" className={r.footer()}>
        <span data-slot="recommendation-card-confidence" className={r.confidence()}>
          <Meter signal={active.signal} tone={active.tone} />
          <span data-slot="recommendation-card-confidence-label" className={r.confidenceLabel()}>{active.label}</span>
        </span>
        <span data-slot="recommendation-card-actions" className={r.actions()}>
          {many && (
            <Collapsible.Trigger asChild>
              <Button variant="outline" size="sm">{t.alternatives}</Button>
            </Collapsible.Trigger>
          )}
          <Button variant={isAccepted ? "success" : active.ctaVariant ?? "accent"} size="sm" onClick={accept}>{isAccepted ? t.accepted : active.cta}</Button>
        </span>
      </div>
    </div>
  );
  /* the card is the root of a collapsible: the Alternatives button opens the drawer */
  return <Collapsible.Root asChild open={many && isOpen} onOpenChange={(d) => toggleOpen(d.open)}>{card}</Collapsible.Root>;
}
