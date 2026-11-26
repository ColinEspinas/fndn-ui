// The library as it ships inside this package (data/, built from the specs and the sources):
//
//   catalog.json          every component's spec, tokens, icons, guides, the stylesheet
//   <framework>.json      the files a project of that framework gets, as they sit in its ui
//                         folder (button/button.tsx, button/index.ts, lib/tv.ts), with what each
//                         imports
//   <framework>-examples.json
//
// A component is its index and everything that imports, followed to the end: its adapters, its
// recipe and logic, the shared files in lib/, the components it is built from. There is no other
// dependency list.
import fs from "node:fs";

const DATA = new URL("../data/", import.meta.url);
const cache = new Map();
function load(file) {
  if (!cache.has(file)) {
    let text;
    try { text = fs.readFileSync(new URL(file, DATA), "utf8"); }
    catch { throw new Error(`The component data is missing (${file}). In the library's repository, run: pnpm build`); }
    cache.set(file, JSON.parse(text));
  }
  return cache.get(file);
}

export const catalog = () => load("catalog.json");
export const library = (framework) => load(`${framework}.json`);
export const examples = (framework) => load(`${framework}-examples.json`);
export const STYLES_DIR = "styles";

export const CATEGORIES = [["actions", "Actions"], ["inputs", "Inputs"], ["overlays", "Overlays"], ["navigation", "Navigation"], ["display", "Display"], ["feedback", "Feedback"], ["agent", "Agent"], ["data", "Data"]];
export const targetsOf = (spec) => spec.targets ?? ["react", "vue", "svelte"];
export const component = (name) => catalog().components.find((s) => s.name === name);
export const oneLine = (spec) => spec.summary ?? (spec.description.match(/^.*?[.!?](\s|$)/)?.[0] ?? spec.description).trim();

const NOISE = new Set(["a", "an", "the", "of", "to", "for", "in", "on", "with", "and", "or", "that", "is", "it", "my", "our", "ui", "component", "components", "page", "screen"]);
/** The words of a query that carry meaning, without their plural or -ing ("settings" → "setting"). */
const stems = (query) => query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !NOISE.has(w)).map((w) => w.replace(/(ing|es|s)$/, "")).filter((w) => w.length > 2);
/* the stem as a whole word, in any of its plain forms: "form" is not "formatting" */
const has = (text, stem) => new RegExp(`\\b${stem}(s|es|ing|ed)?\\b`).test(text);

/** The rows of "which component for what" that a query touches, with how many of its words: best first. */
function matchingNeeds(query) {
  const words = stems(query);
  return catalog().needs
    .map((row) => ({ row, hits: words.filter((w) => has(row.need.toLowerCase(), w)).length }))
    .filter((m) => m.hits > 0).sort((a, b) => b.hits - a.hits).slice(0, 3);
}
export const needs = (query) => matchingNeeds(query).map((m) => m.row);

/** Components that answer a need, best first. No query: every component, in catalogue order. */
export function search(query = "", { category, framework } = {}) {
  const list = catalog().components.filter((s) => (!category || s.category === category) && (!framework || targetsOf(s).includes(framework)));
  const words = stems(query);
  if (!words.length) return list;
  /* a component named by a matching row of the needs table outranks one that only mentions the words */
  const named = new Map();
  for (const { row, hits } of matchingNeeds(query)) for (const name of row.components) named.set(name, Math.max(named.get(name) ?? 0, 10 * hits));
  const score = (s) => {
    const fields = [[s.name.replace(/-/g, " "), 8], [s.title.toLowerCase(), 8], [oneLine(s).toLowerCase(), 4], [s.description.toLowerCase(), 1]];
    return (named.get(s.name) ?? 0) + words.reduce((sum, w) => sum + fields.reduce((n, [text, weight]) => n + (has(text, w) ? weight : 0), 0), 0);
  };
  const scored = list.map((s) => [score(s), s]).filter(([n]) => n > 0).sort((a, b) => b[0] - a[0]);
  /* a passing mention beside a real match is noise */
  return scored.filter(([n]) => n >= scored[0][0] / 4).map(([, s]) => s);
}

export const indexOf = (name) => `${name}/index.ts`;

/** Every file the named components need, and the npm packages those files import. A component
 * that is reached through one of its adapters comes whole, with its index. */
export function closure(framework, names) {
  const lib = library(framework);
  const files = new Set();
  const visit = (file) => {
    if (files.has(file)) return;
    files.add(file);
    lib.files[file].imports.forEach(visit);
  };
  names.forEach((name) => visit(indexOf(name)));
  for (let grew = true; grew; ) {
    grew = false;
    for (const [name, adapters] of Object.entries(lib.components)) {
      if (!files.has(indexOf(name)) && adapters.some((f) => files.has(f))) { visit(indexOf(name)); grew = true; }
    }
  }
  const npm = new Set([...files].flatMap((f) => lib.files[f].npm));
  return { files: [...files].sort(), npm: [...npm].sort(), components: Object.keys(lib.components).filter((name) => files.has(indexOf(name))) };
}

/** The stylesheet files as installed: styles/<file>. */
export function styles() {
  return Object.fromEntries(Object.entries(catalog().styles).map(([f, content]) => [`${STYLES_DIR}/${f}`, content]));
}
