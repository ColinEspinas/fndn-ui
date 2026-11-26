/* The catalogue: every spec, sorted and grouped, and the files `fndn add` writes for each.
 * Server only (Astro frontmatter, endpoints): read through lib/content.ts, so no page depends on
 * these files in the dev server's module graph; the raw sources never reach the browser except as
 * the endpoints' responses (/source/..., /example-code/...). Each list is a function: in dev it
 * follows the files as they are saved. */
import { closure, componentFiles, libraryOf, type Library } from "./files";
import { showcases } from "./showcase";
import { derive, exists, readJson, readText } from "./content";
import { CATEGORIES, FOUNDATIONS, FRAMEWORKS, KINDS, UI_DIR, firstSentence, type Example, type Fw, type SourceFile, type Spec } from "./types";

export type { SourceFile } from "./types";
export { stripGenerated } from "./files";

/* The Worst case switch of the playground renders the test fixtures' worst cases
 * (components/<name>/<name>.fixtures.json): the docs' examples are files (lib/examples.ts), the
 * worst cases are test data the stage shows as they are. */
export const worstCasesOf = (name: string): Example[] => {
  const f = `components/${name}/${name}.fixtures.json`;
  return exists(f) ? readJson<{ worstCase?: Example[] }>(f).worstCase ?? [] : [];
};

const rank = (s: Spec) => { const i = CATEGORIES.findIndex(([id]) => id === s.category); return i < 0 ? CATEGORIES.length : i; };

/** Every spec: components/<name>/<name>.json (the folder's other JSON files are its fixtures and examples). */
export const specs = (): Spec[] => derive("specs", ["components/*/*.json"], (files) => files
  .filter((f) => { const [, dir, base] = f.split("/"); return base === `${dir}.json`; })
  .map((f) => readJson<Spec>(f))
  .map((s) => ({ ...s, title: s.title || s.name, description: s.description ?? "", summary: s.summary || firstSentence(s.description ?? ""), props: s.props ?? {} }))
  .sort((a, b) => rank(a) - rank(b) || (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name)));

export const specOf = (name: string) => specs().find((s) => s.name === name);

/** The library of a framework as a project gets it (lib/files.ts). */
export const library = (fw: Fw): Library => libraryOf(fw, specs);

export type Group = { id: string; label: string; specs: Spec[] };
export type Section = { kind: string; heading: string; lede: string; groups: Group[] };

/** Components, then Blocks (the spec's `kind`), each grouped by category in catalogue order. */
export function sections(): Section[] {
  const known = new Set(CATEGORIES.map(([id]) => id));
  const cats: [string, string][] = [...CATEGORIES, ["", "Other"]];
  const all = specs();
  return KINDS.map(([kind, heading, lede]) => ({
    kind, heading, lede,
    groups: cats
      .map(([id, label]) => ({ id: id || "other", label, specs: all.filter((s) => (s.kind === "block" ? "block" : "component") === kind && (id ? s.category === id : !known.has(s.category))) }))
      .filter((g) => g.specs.length),
  }));
}

/** The files of a component page in one framework: its folder (index, adapters, recipe, logic)
 * and the lib/ files they import, each with where it lands in the project and its label (its path
 * in the ui folder, `card/Card.vue`, `lib/tv.ts`); and the components it is built from, which the
 * page links instead of listing their files. */
export function ownFiles(spec: Spec, fw: Fw): { files: SourceFile[]; builtFrom: string[] } {
  const lib = library(fw);
  if (!lib.components[spec.name]) return { files: [], builtFrom: [] };
  const { files, builtFrom } = componentFiles(lib, spec.name);
  return { files: files.map((f) => ({ path: `${UI_DIR[fw]}/${f}`, label: f, code: lib.files[f]!.content })), builtFrom };
}

export function allOwnFiles(spec: Spec): Record<Fw, { files: SourceFile[]; builtFrom: string[] }> {
  return Object.fromEntries(FRAMEWORKS.map((fw) => [fw, ownFiles(spec, fw)])) as Record<Fw, { files: SourceFile[]; builtFrom: string[] }>;
}

/** What `fndn add <names…>` writes in one framework: the named components' folders and everything
 * they import (lib/ and the components they are built from), as paths in the ui folder. `install`:
 * the one line it ends with, for the npm packages those files import (versions as
 * components/package.json declares them). */
export function addedFiles(names: string[], fw: Fw): { files: string[]; install: string } {
  const { files, npm } = closure(library(fw), names);
  const ranges = readJson<{ dependencies?: Record<string, string> }>("components/package.json").dependencies ?? {};
  const install = `npm install ${npm.map((p) => (ranges[p] ? `${p}@${ranges[p]}` : p)).join(" ")}`;
  return { files, install };
}

/* ── guides: the Markdown of docs/ ───────────────────────────── */
/** The guides the site publishes, in this order: [file under docs/, title]. The other files of docs/
 * are the maintainers' and are not on the site. The id is the file's path in lower case
 * (docs/DESIGN.md is /guides/design). */
const GUIDES: [file: string, title: string][] = [
  ["DESIGN", "Design"],
  ["design/motion", "Motion"],
  ["design/interaction", "Interaction"],
  ["design/accessibility", "Accessibility"],
  ["authoring", "Building a component"],
];
export type Guide = { id: string; path: string; title: string; heading: string; markdown: string };
export const guides = (): Guide[] => derive("guides", GUIDES.map(([file]) => `docs/${file}.md`), () => GUIDES
  .map(([file, title]) => {
    const path = `docs/${file}.md`;
    const markdown = readText(path);
    const heading = markdown.match(/^#{1,3}\s+(.+)$/m)?.[1]?.trim() ?? title;
    return { id: file.toLowerCase(), path, title, heading, markdown };
  }));
export const guideOf = (id: string) => guides().find((g) => g.id === id);

/* ── the search palette's index ──────────────────────────────── */
export type SearchEntry = { value: string; label: string; meta: string };
export function searchIndex(): SearchEntry[] {
  return [
    { value: "/", label: "Overview", meta: "Page" },
    { value: "/installation", label: "Installation", meta: "Page" },
    ...specs().filter((s) => s.kind !== "block").map((s) => ({ value: `/components/${s.name}`, label: s.title, meta: "Component" })),
    ...specs().filter((s) => s.kind === "block").map((s) => ({ value: `/components/${s.name}`, label: s.title, meta: "Block" })),
    ...FOUNDATIONS.map(([id, label]) => ({ value: `/foundations/${id}`, label, meta: "Foundation" })),
    ...showcases().map((a) => ({ value: `/showcase/${a.name}`, label: a.title, meta: "Showcase" })),
    ...guides().map((g) => ({ value: `/guides/${g.id}`, label: g.title, meta: "Guide" })),
  ];
}
