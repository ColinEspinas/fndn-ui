/* Shapes read from the component folders: the spec (components/<name>/<name>.json), the worst
 * cases of its test fixtures (<name>.fixtures.json) and its examples (examples/index.json). */
export type Step = { after: number; props: Record<string, unknown> };
export type Example = {
  name: string;
  /** JSON props. Props the spec marks `model` are bound two-way (React: their uncontrolled twin). */
  props?: Record<string, unknown>;
  /** Default slot / children text. */
  text?: string;
  /** Width in px, passed to the component root as an inline style. */
  width?: number;
  /** false: the example needs rich children; no framework renders it. */
  frameworks?: boolean;
  /** A scenario: each step waits `after` ms, then merges its props over the current ones. */
  steps?: Step[];
};
/** A file shown on a page: where it lands in the user's project, its tab label and its code. */
export type SourceFile = { path: string; label: string; code: string };
export type Mounted = (() => void) & { update?: (props: Record<string, unknown>) => Promise<void> };

export type PropSpec = {
  type: string;
  values?: string[];
  default?: unknown;
  attr?: string;
  part?: string;
  model?: boolean;
  description?: string;
  items?: Record<string, string>;
  /** The TypeScript type when `type` cannot say it (a union); shown instead of `type`. */
  ts?: string;
};

export type Spec = {
  name: string;
  title: string;
  /** One plain sentence: the lede of the page, the overview card, llms.txt. */
  summary: string;
  description: string;
  kind: string;
  category: string;
  order?: number;
  engine?: string;
  status: string;
  props: Record<string, PropSpec>;
  dependencies?: string[];
  files?: Record<string, string[]>;
  /** The frameworks the component has adapters for; all three when left out. */
  targets?: Fw[];
  /** The playground's starting point (examples/index.json), on the island's copy only. */
  playground?: Example;
  /** The example files, in order (examples/index.json), on the island's copy only. */
  exampleFiles?: { file: string; title: string; steps?: boolean }[];
  /** The test fixtures' worst cases, on the island's copy only. */
  worstCase?: Example[];
  anatomy?: Part[];
  slots?: Record<string, string>;
  events?: Record<string, string>;
  states?: string[];
  tokens?: string[];
  a11y?: { role?: string; keyboard?: string[]; notes?: string[] };
  motion?: string[];
};
export type Part = { part: string; class?: string; element?: string; optional?: boolean; repeat?: boolean; description?: string };

export const FRAMEWORKS = ["react", "vue", "svelte"] as const;
export type Fw = (typeof FRAMEWORKS)[number];
export type Framework = Fw;
/** The frameworks a component has adapters for (scripts/lib.mjs targetsOf). */
export const targetsOf = (spec: Pick<Spec, "targets">): readonly Fw[] => spec.targets ?? FRAMEWORKS;
export const FW_LABEL: Record<Fw, string> = { react: "React", vue: "Vue", svelte: "Svelte" };

/* catalogue order: category, then `order`, then name (same as scripts/lib.mjs) */
export const CATEGORIES: [id: string, label: string][] = [
  ["actions", "Actions"], ["inputs", "Inputs"], ["overlays", "Overlays"], ["navigation", "Navigation"],
  ["display", "Display"], ["feedback", "Feedback"], ["agent", "Agent"], ["data", "Data"],
];
export const FOUNDATIONS: [id: string, label: string][] = [
  ["colour", "Colour"], ["type", "Type"], ["elevation", "Elevation"], ["shape", "Shape"],
  ["motion", "Motion"], ["icons", "Icons"], ["spacing", "Spacing"],
];
export const KINDS: [kind: string, heading: string, lede: string][] = [
  ["component", "Components", "The basic building blocks: one control or one piece of display each."],
  ["block", "Blocks", "Built from several components for a product use: agent surfaces, tables, composers."],
];

export const pascal = (k: string) => k.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase());
export const cap = (k: string) => k.charAt(0).toUpperCase() + k.slice(1);
export const modelProps = (spec: Pick<Spec, "props">) => Object.entries(spec.props).filter(([, d]) => d.model).map(([k]) => k);
/** Told of a two-way prop the mounted component changed itself (the playground's props panel). */
export type ModelReport = (name: string, value: unknown) => void;
/** The two-way props the playground drives live: those with a change event (`<prop>Change`), whose
 * callback reports a change back (React `onXChange`, Vue `update:x`, Svelte `onxchange`). The others
 * stay uncontrolled: controlled without a callback, a field could not be typed in. */
export const liveModelProps = (spec: Pick<Spec, "props" | "events">) => modelProps(spec).filter((k) => spec.events?.[`${k}Change`] !== undefined);
/** Ark reads the writing direction from its LocaleProvider. */
export const arkLocale = (dir: "ltr" | "rtl") => (dir === "rtl" ? "ar" : "en-US");
/** A JSON `style` is a React style object ({ height: 24 }); Vue and Svelte take CSS text, where a
 * bare number is a length in px (as React reads it). */
const UNITLESS = /^(opacity|zIndex|flex|flexGrow|flexShrink|order|lineHeight|fontWeight|zoom)$/;
export const cssText = (style: unknown): unknown =>
  style && typeof style === "object"
    ? Object.entries(style as Record<string, unknown>)
        .map(([k, v]) => `${k.startsWith("--") ? k : k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${typeof v === "number" && !UNITLESS.test(k) ? `${v}px` : v}`)
        .join("; ")
    : style;
export const firstSentence = (s: string) => { const m = s.match(/^.*?[.!?](\s|$)/); return (m ? m[0] : s).trim(); };
/* the tool's name and its add command, from the generator the tool itself uses */
export { COMMAND, installCommand } from "../../../../packages/cli/src/render.js";
/** The one folder `fndn init` gives the library (fndn.json `dir`), per framework. */
export const UI_DIR: Record<Fw, string> = { react: "src/components/ui", vue: "src/components/ui", svelte: "src/lib/components/ui" };
