// Shared helpers for the build/validate scripts.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
export const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
export const readJson = (rel) => JSON.parse(read(rel));

export const pascal = (kebab) => kebab.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());

/** Catalogue order: categories as listed here, then `order`, then name. */
export const CATEGORIES = [
  ["actions", "Actions"],
  ["inputs", "Inputs"],
  ["overlays", "Overlays"],
  ["navigation", "Navigation"],
  ["display", "Display"],
  ["feedback", "Feedback"],
  ["agent", "Agent"],
  ["data", "Data"],
];
export function sortSpecs(list) {
  const rank = (s) => CATEGORIES.findIndex(([id]) => id === s.spec.category);
  return [...list].sort((a, b) => rank(a) - rank(b) || (a.spec.order ?? 99) - (b.spec.order ?? 99) || a.spec.name.localeCompare(b.spec.name));
}

/* Where things are. A component is one folder, components/<name>/: its spec (<name>.json), its
 * recipe (<name>.recipe.ts), the logic its adapters share (<name>.logic.ts and other .ts files),
 * its React, Vue and Svelte adapters, its test (<name>.test.mjs), its fixtures and its examples.
 * What several components share is in components/lib/. */
export const COMPONENTS = "components";
export const LIB = "components/lib";
export const specPath = (name) => `${COMPONENTS}/${name}/${name}.json`;
export const fixturesPath = (name) => `${COMPONENTS}/${name}/${name}.fixtures.json`;
export const testPath = (name) => `${COMPONENTS}/${name}/${name}.test.mjs`;
export const filePath = (name, file) => `${COMPONENTS}/${name}/${file}`;
/** The names of the component folders (every folder with a spec of its own name). */
export const componentNames = () => fs.readdirSync(path.join(ROOT, COMPONENTS)).filter((n) => fs.existsSync(path.join(ROOT, specPath(n)))).sort();

/** Test fixtures of a component (<name>.fixtures.json: { examples, worstCase }): the props its
 * tests and the docs render it with. They are not part of the spec. */
export function fixturesOf(name) {
  const f = path.join(ROOT, fixturesPath(name));
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
}
/** The spec as the tools use it: the contract plus its test fixtures (spec.examples, spec.worstCase). */
export const withFixtures = (spec) => ({ ...spec, ...fixturesOf(spec.name) });

/** Every component: `spec` has its fixtures attached, `raw` is the spec file as written. */
export function loadSpecs() {
  return componentNames().map((name) => {
    const raw = readJson(specPath(name));
    return { file: specPath(name), spec: withFixtures(raw), raw };
  });
}

/** The frameworks a component has adapters for: the spec's `targets`, all three when it is left out
 * (a new component may be React only until its Vue and Svelte adapters follow). Everything that
 * walks the specs asks this, never a list of its own. */
export const FRAMEWORKS = ["react", "vue", "svelte"];
export const targetsOf = (spec) => spec.targets ?? FRAMEWORKS;
/** The targets a component's qa script runs: the frameworks named on its command line (run.mjs
 * passes them; `--fast` passes react only), else its spec's targets. A named target the spec does
 * not list is skipped, not failed. */
export function qaTargets(name, argv = process.argv.slice(2)) {
  const listed = targetsOf(readJson(specPath(name)));
  const asked = argv.filter((a) => FRAMEWORKS.includes(a));
  return asked.length ? asked.filter((fw) => listed.includes(fw)) : listed;
}

/** The adapter files of a component in one framework (names inside its folder), by convention
 * unless the spec overrides. */
export function adapterFiles(spec, framework) {
  if (spec.files?.[framework]) return spec.files[framework];
  const P = pascal(spec.name);
  return { react: [`${spec.name}.tsx`], vue: [`${P}.vue`], svelte: [`${P}.svelte`] }[framework];
}

/**
 * The lines that export a component's adapters in one framework (packages/cli/src/imports.js).
 * `from(file)` gives the import specifier of an adapter file. Files that do not exist yet (an
 * adapter still being written) are skipped; the validator reports them.
 */
export function exportLines(spec, framework, from) {
  return indexLines(framework, adapterSources(spec, framework), from);
}
/** The adapter files of a component in one framework, with their source. */
export const adapterSources = (spec, framework) => adapterFiles(spec, framework).filter((f) => exists(filePath(spec.name, f))).map((file) => ({ file, source: read(filePath(spec.name, file)) }));

/* Minimal JSON-schema checker — enough for our two schemas (type, required,
 * properties, additionalProperties, enum, pattern, items, minItems). */
export function validateSchema(schema, value, at = "$") {
  const errors = [];
  const typeOf = (v) => (Array.isArray(v) ? "array" : v === null ? "null" : typeof v);
  const check = (sch, val, p) => {
    if (!sch || sch === true) return;
    if (sch.enum && !sch.enum.includes(val)) errors.push(`${p}: expected one of ${JSON.stringify(sch.enum)}, got ${JSON.stringify(val)}`);
    if (sch.type && typeOf(val) !== sch.type) { errors.push(`${p}: expected ${sch.type}, got ${typeOf(val)}`); return; }
    if (sch.pattern && typeof val === "string" && !new RegExp(sch.pattern).test(val)) errors.push(`${p}: "${val}" does not match ${sch.pattern}`);
    if (typeOf(val) === "object") {
      for (const r of sch.required ?? []) if (!(r in val)) errors.push(`${p}: missing required "${r}"`);
      for (const [k, v] of Object.entries(val)) {
        if (sch.properties && k in sch.properties) check(sch.properties[k], v, `${p}.${k}`);
        else if (sch.additionalProperties === false) errors.push(`${p}: unexpected property "${k}"`);
        else if (typeof sch.additionalProperties === "object") check(sch.additionalProperties, v, `${p}.${k}`);
      }
    }
    if (typeOf(val) === "array") {
      if (sch.minItems !== undefined && val.length < sch.minItems) errors.push(`${p}: expected at least ${sch.minItems} items`);
      if (sch.items) val.forEach((v, i) => check(sch.items, v, `${p}[${i}]`));
    }
  };
  check(schema, value, at);
  return errors;
}

/* Shared recipes: parts several components compose into their own recipes (the surface of a
 * field, the row of a list, the surface of a popup). They live in components/lib/, with no spec
 * and no adapter. */
export const SHARED_RECIPES = ["control", "option", "popup"];
/* A recipe is bundled in memory with esbuild (installed with Vite) and imported, so the `tv`
 * result can be read: `slots`, `variants`, `compoundVariants`, `defaultVariants`, `base`.
 * Returns null when the component has no recipe. */
export const recipePath = (name) => (SHARED_RECIPES.includes(name) ? `${LIB}/${name}.ts` : `${COMPONENTS}/${name}/${name}.recipe.ts`);
let esbuild;
export async function loadRecipe(name) {
  const file = path.join(ROOT, recipePath(name));
  if (!fs.existsSync(file)) return null;
  if (!esbuild) {
    const store = path.join(ROOT, "node_modules/.pnpm");
    const dir = fs.readdirSync(store).filter((f) => /^esbuild@\d/.test(f)).sort().pop();
    if (!dir) throw new Error("esbuild not found in node_modules/.pnpm (it comes with Vite)");
    esbuild = await import(path.join(store, dir, "node_modules/esbuild/lib/main.js"));
  }
  const out = await esbuild.build({ entryPoints: [file], bundle: true, format: "esm", platform: "neutral", write: false, logLevel: "silent" });
  const mod = await import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString("base64")}`);
  const recipe = Object.values(mod).find((v) => typeof v === "function" && (v.slots || v.variants || v.base));
  if (!recipe) throw new Error(`${recipePath(name)} exports no tv() recipe`);
  return { slots: recipe.slots ?? null, base: recipe.base, variants: recipe.variants ?? {}, compoundVariants: recipe.compoundVariants ?? [], compoundSlots: recipe.compoundSlots ?? [], defaultVariants: recipe.defaultVariants ?? {} };
}

/** Every class string in a value from a recipe (strings, nested arrays, { slot: classes } maps). */
export function recipeClasses(v, out = []) {
  if (typeof v === "string") out.push(...v.split(/\s+/).filter(Boolean));
  else if (Array.isArray(v)) v.forEach((x) => recipeClasses(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => recipeClasses(x, out));
  return out;
}

export { bareUtility } from "../packages/cli/src/rules.js";
import { indexLines } from "../packages/cli/src/imports.js";
export const camel = (kebab) => kebab.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
