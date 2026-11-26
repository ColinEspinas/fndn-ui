/* Data of the foundations pages, from spec/tokens.json (descriptions, $transitions) and
 * the generated tokens module (values). Server only. */
import { reducedMotion, tokens } from "@fndn/core/tokens";
import { readJson } from "./content";

type TokenDef = { $value?: unknown; $description?: string };
/* spec/tokens.json read from the file (lib/content.ts), not imported */
const tokenSpecJson = () => readJson<Record<string, unknown>>("spec/tokens.json");
const tokenSpec = () => tokenSpecJson() as unknown as Record<string, Record<string, TokenDef> & { $description?: string }>;

export const desc = (group: string, name: string) => tokenSpec()[group]?.[name]?.$description ?? "";
export const groupDesc = (group: string) => (tokenSpec()[group] as { $description?: string } | undefined)?.$description ?? "";
export const both = (v: unknown) => (typeof v === "object" && v ? (v as { light: string; dark: string }) : { light: String(v), dark: String(v) });
export const T = tokens as unknown as Record<string, Record<string, unknown>>;

export const INTRO: Record<string, string> = {
  colour: "Cool, blue-tinted neutrals with solid hairlines, never alpha borders. One accent; semantic colour is a condiment. Every colour has a light and a dark value, and each is a utility: bg-surface, text-ink-2, border-line.",
  type: "Inter with tight tracking and tabular numerals; JetBrains Mono for anything technical. The size utilities (text-xs … text-xl) set the size only, never the line height.",
  elevation: "Every elevation starts with the 1px hairline ring, then adds layered single-digit-opacity shadows. Only things that float get more than a card.",
  shape: "Tight radii, picked by role: chips, controls, cards, windows, pills.",
  motion: "Durations and easings are tokens, combined into a few named timings; a recipe uses only those timings, through the motion-<what>-<timing> utilities. The view options in the top bar slow everything down at once.",
  icons: "Phosphor icons, one vocabulary for React, Vue and Svelte. Click an icon to copy its name.",
  spacing: "A 4px grid.",
};

export type Timing = { name: string; duration: string; durationValue: string; easing: string; easingValue: string };
/** The named timings ($transitions): [duration token, easing token or CSS keyword]. */
export function timings(): Timing[] {
  const t = (tokenSpecJson() as unknown as { $transitions: Record<string, unknown> }).$transitions;
  return Object.entries(t)
    .filter(([k]) => !k.startsWith("$"))
    .map(([name, v]) => {
      const [d, e] = v as [string, string];
      const ev = T.easing?.[e];
      return { name, duration: d, durationValue: String(T.duration?.[d] ?? "?"), easing: e, easingValue: ev === undefined ? e : String(ev) };
    });
}

export const timingsDescription = () => (tokenSpecJson() as unknown as { $transitions: { $description?: string } }).$transitions.$description ?? "";

export type Row = { name: string; value: string; reduced?: string; description: string };
export function motionRows(): { durations: Row[]; easings: Row[]; values: Row[] } {
  const rd = reducedMotion.duration as Record<string, string>;
  const rm = reducedMotion.motion as Record<string, string>;
  return {
    durations: Object.entries(tokens.duration).map(([k, v]) => ({ name: k, value: String(v), reduced: rd[k], description: desc("duration", k) })),
    easings: Object.entries(tokens.easing).map(([k, v]) => ({ name: k, value: String(v), description: desc("easing", k) })),
    values: Object.entries(tokens.motion).map(([k, v]) => ({ name: k, value: String(v), reduced: rm[k], description: desc("motion", k) })),
  };
}
