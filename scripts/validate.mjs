// Checks that the specs, the recipes and every framework adapter agree.
//   - specs match spec/schema/component.schema.json, their test fixtures match
//     spec/schema/fixtures.schema.json, tokens match tokens.schema.json
//   - a spec's title is Title Case and its summary one plain sentence
//   - each framework the spec lists in `targets` (all three by default) has the adapter files; a
//     framework it does not list has none
//   - every component has a recipe: `base` only, or slots named `base` + the spec's parts in
//     camelCase (root = base)
//   - every class of a recipe passes the class rules (motion, colours, radii and shadows from the
//     tokens, logical sides) and names no ui-* class: a part is found by [data-slot=…]
//   - each adapter marks the root data-slot="<name>" and every non-optional part
//     data-slot="<name>-<part>" or data-<name>="<part>" (also as a key of an attribute object in the
//     same file: { "data-<name>": "<part>" }; a part built through a helper says "marked": false in
//     the spec, with the reason in its description), and uses no ui-<name> class
//   - every value of an enum prop that is a recipe variant has that variant
//   - a prop keeps `attr` only while an adapter sets that attribute
//   - every Phosphor icon an adapter imports is in the vocabulary (spec/icons.json)
//   - a fixture that plays steps sets only props the component has (none of them two-way), with
//     delays of 0 or more that add up to under 20 seconds, and is rendered by the frameworks
//   - `dependencies` lists exactly the other components a component's files import from
//   - the shared recipes (components/lib) pass the class rules and carry no ui-* class
//   - every recipe, adapter and example passes the rules the tool's `check` applies to a user's
//     project (packages/cli/src/rules.js): the library is held to what it asks of its users
//   - every recipe passes the composition lint (scripts/lint-composition.mjs, rules in docs/design/interaction.md)
//   - base.css takes its motion from the tokens
//
// node scripts/validate.mjs                 everything
// node scripts/validate.mjs button select   only these components (handy while working on a few)
import fs from "node:fs";
import path from "node:path";
import { ROOT, COMPONENTS, read, exists, readJson, loadSpecs, adapterFiles, filePath, fixturesPath, validateSchema, loadRecipe, recipePath, recipeClasses, bareUtility, camel, SHARED_RECIPES, FRAMEWORKS, targetsOf } from "./lib.mjs";
import { AMBIGUOUS, allowedLines, classRules, keyframeNames, lintMotion, scanClasses, unnamedIconControls } from "../packages/cli/src/rules.js";
import { reportComposition } from "./lint-composition.mjs";

const only = new Set(process.argv.slice(2).filter((a) => !a.startsWith("-")));

const errors = [];
const err = (m) => errors.push(m);

const tokens = readJson("spec/tokens.json");
const tokenSchema = readJson("spec/schema/tokens.schema.json");
const componentSchema = readJson("spec/schema/component.schema.json");
const fixturesSchema = readJson("spec/schema/fixtures.schema.json");
validateSchema(tokenSchema, tokens, "tokens.json").forEach(err);

const allSpecs = loadSpecs();
const names = new Set(allSpecs.map((s) => s.spec.name));
for (const n of only) if (!names.has(n)) { console.error(`error unknown component "${n}"`); process.exit(1); }
const specs = only.size ? allSpecs.filter((s) => only.has(s.spec.name)) : allSpecs;
if (!only.size) {
  const baseCss = read("packages/core/css/base.css");
  for (const f of lintMotion(baseCss, { sharedKeyframes: keyframeNames(baseCss) })) err(`[base] packages/core/css/base.css:${f.line} motion/${f.rule}: ${f.message}`);
}
/* The class rules of `fndn check` (motion from the tokens, colours, radii and shadows from the tokens,
 * the scale and layer tokens, logical sides), over every class of every recipe. Returns the reason, or null. */
const rules = classRules(tokens);
/* the icon vocabulary, as the component names of the Phosphor packages ("check-circle" → CheckCircle) */
const pascalCase = (k) => k.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
const vocabulary = new Set(Object.values(readJson("spec/icons.json").icons).map((i) => pascalCase(i.phosphor)));
/* the icons a file imports from its framework's Phosphor package (React: named; Vue: Ph-prefixed;
 * Svelte: one default import per icon, from phosphor-svelte/lib/<Name>) */
const iconImports = (src) => [
  ...[...src.matchAll(/import\s+\{([^}]*)\}\s+from\s+["']@phosphor-icons\/(?:react|vue)["']/g)].flatMap((m) => m[1].split(",").map((n) => n.trim().split(/\s+as\s+/)[0]).filter((n) => n && !n.startsWith("type "))),
  ...[...src.matchAll(/from\s+["']phosphor-svelte\/lib\/([A-Za-z0-9]+)["']/g)].map((m) => m[1]),
].map((n) => n.replace(/^Ph(?=[A-Z])/, "").replace(/Icon$/, ""));
/* (a compound variant's `shape: "rounded"` is a value, not a class: the bare words are skipped) */
const classProblem = (cls) => (AMBIGUOUS.has(bareUtility(cls)) ? null : rules.check(cls)?.message ?? null);
const kebabPart = (p) => p.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

for (const { file, spec, raw } of specs) {
  const tag = `[${spec.name}]`;
  /* the spec file is the contract only; its test fixtures (examples, worstCase) live beside it
   * in <name>.fixtures.json and are checked against their own schema */
  validateSchema(componentSchema, raw, file).forEach(err);
  validateSchema(fixturesSchema, Object.fromEntries(["examples", "worstCase"].filter((k) => k in spec).map((k) => [k, spec[k]])), fixturesPath(spec.name)).forEach(err);
  if (!file.endsWith(`/${spec.name}.json`)) err(`${tag} file name must match spec name`);
  /* the words people read first: a Title Case title and a one-sentence summary in plain words */
  const SMALL = new Set(["a", "an", "and", "of", "or", "the", "to", "in", "on", "for", "with"]);
  const lowWord = (spec.title ?? "").split(" ").find((w, i) => /^[a-z]/.test(w) && !(i > 0 && SMALL.has(w)));
  if (lowWord) err(`${tag} title "${spec.title}" is not Title Case ("${lowWord}")`);
  if (typeof spec.summary === "string") {
    const s = spec.summary.trim();
    if (!/[.!?]$/.test(s) || /[.!?]\s+\S/.test(s)) err(`${tag} summary must be one sentence: "${s}"`);
    if (s.length > 120) err(`${tag} summary is ${s.length} characters; keep it under 120 (the details go in description)`);
    const jargon = s.match(/\d+(?:\.\d+)?px|--fndn-|`|\b_[\w-]+\.ts\b|\b(?:Zag|Ark)\b|\b(?:color|shadow|radius|duration|easing|motion|space|text)\.[a-z]/);
    if (jargon) err(`${tag} summary uses "${jargon[0]}": plain words only (px, tokens, engine and helper names go in description)`);
  }

  /* adapters for the frameworks the spec lists (`targets`, all three by default), and none for the others */
  for (const fw of FRAMEWORKS) {
    const listed = targetsOf(spec).includes(fw);
    for (const f of adapterFiles(spec, fw)) {
      const p = filePath(spec.name, f);
      if (listed && !exists(p)) err(`${tag} missing ${fw} adapter ${p}`);
      if (!listed && exists(p)) err(`${tag} ${p} exists but the spec's targets (${targetsOf(spec).join(", ")}) do not list ${fw}: add it to targets or remove the file`);
    }
  }

  const rp = recipePath(spec.name);
  let recipe = null;
  try { recipe = await loadRecipe(spec.name); } catch (e) { err(`${tag} ${rp} cannot be loaded: ${e.message.split("\n")[0]}`); continue; }
  if (!recipe) { err(`${tag} missing ${rp}`); continue; }

  /* recipe: base only, or slots base + the parts */
  const parts = spec.anatomy.filter((p) => p.part !== "root");
  if (recipe.slots) {
    const allowed = new Set(["base", ...parts.map((p) => camel(kebabPart(p.part)))]);
    for (const key of Object.keys(recipe.slots)) if (!allowed.has(key)) err(`${tag} ${rp} slot "${key}" is not "base" or a part of the spec (${[...allowed].join(", ")})`);
  } else if (parts.length && !parts.every((p) => p.optional)) err(`${tag} ${rp} has no slots but the spec has parts (${parts.map((p) => p.part).join(", ")})`);
  for (const cls of recipeClasses([recipe.base, recipe.slots, recipe.variants, recipe.compoundVariants, recipe.compoundSlots])) {
    const why = classProblem(cls); if (why) err(`${tag} ${rp} "${cls}": ${why}`);
    for (const m of cls.matchAll(/\.(ui-[a-z0-9_-]+)/g)) err(`${tag} ${rp} "${cls}": names .${m[1]}; name a part by [data-slot=…]`);
  }

  /* every value an enum prop may take is a value the recipe styles (a prop that is not a recipe
   * variant, such as a placement, is the adapter's business) */
  for (const [prop, def] of Object.entries(spec.props)) {
    const variant = recipe.variants?.[prop];
    if (def.type !== "enum" || !variant) continue;
    for (const value of def.values ?? []) if (!(value in variant)) err(`${tag} prop ${prop}: "${value}" has no variant in ${rp}`);
  }

  /* spec: attr only while an adapter sets it */
  const srcs = targetsOf(spec).map((fw) => adapterFiles(spec, fw).map((f) => filePath(spec.name, f)).filter(exists)).filter((files) => files.length);
  const joined = srcs.flat().map(read).join("\n");
  for (const [prop, def] of Object.entries(spec.props)) if (def.attr && !joined.includes(def.attr)) err(`${tag} prop ${prop} keeps attr "${def.attr}" but no adapter sets it: remove the attr`);

  /* adapters: the root and every part marked, no fndn-<name> class */
  const own = new RegExp(`(?<![\\w-])fndn-${spec.name}(?:__[a-z0-9-]+)?(?![\\w-])`);
  for (const files of srcs) {
    const src = files.map(read).join("\n");
    const has = (v) => new RegExp(`data-slot=(?:"|'|\\{["'\`])${v}["'\`]`).test(src);
    if (!has(spec.name)) err(`${tag} ${files[0]} does not mark its root data-slot="${spec.name}"`);
    for (const p of parts) {
      if (p.optional || p.marked === false) continue;
      const k = kebabPart(p.part);
      /* data-<name>="<part>" as an attribute, or as a key of an attribute object passed on in the same file ({ "data-<name>": "<part>" }) */
      if (!has(`${spec.name}-${k}`) && !new RegExp(`data-${spec.name}=(?:"|'|\\{["'\`])${k}["'\`]`).test(src) && !new RegExp(`["']data-${spec.name}["']\\s*:\\s*["'\`]${k}["'\`]`).test(src)) err(`${tag} ${files[0]} does not mark part "${p.part}" (data-slot="${spec.name}-${k}" or data-${spec.name}="${k}")`);
    }
    const m = own.exec(src);
    if (m) err(`${tag} ${files.find((f) => own.test(read(f)))} uses the class ${m[0]}: mark parts with data-slot`);
  }

  /* icons come from the vocabulary */
  for (const f of srcs.flat()) for (const icon of iconImports(read(f))) if (!vocabulary.has(icon)) err(`${tag} ${f} imports the icon ${icon}, which is not in spec/icons.json`);

  /* a fixture that plays steps: props the component has, none two-way, under 20 seconds */
  for (const example of spec.examples ?? []) {
    if (!example.steps) continue;
    const at = `${fixturesPath(spec.name)} "${example.name}"`;
    if (example.frameworks === false) err(`${tag} ${at} plays steps but no framework renders it`);
    let total = 0;
    for (const step of example.steps) {
      if (!(step.after >= 0)) err(`${tag} ${at}: a step's "after" must be 0 or more`);
      total += step.after ?? 0;
      for (const prop of Object.keys(step.props ?? {})) {
        if (!(prop in spec.props)) err(`${tag} ${at}: a step sets "${prop}", which is not a prop`);
        else if (spec.props[prop].model) err(`${tag} ${at}: a step sets "${prop}", a two-way prop the component owns once mounted`);
      }
    }
    if (total >= 20000) err(`${tag} ${at}: its steps take ${total}ms; keep a scenario under 20 seconds`);
  }

  /* dependencies are what the component's files import from other components' folders: no less
   * (the docs say what a component is built from) and no more */
  const folder = fs.readdirSync(`${ROOT}/${COMPONENTS}/${spec.name}`).filter((f) => /\.(ts|tsx|vue|svelte)$/.test(f)).map((f) => filePath(spec.name, f));
  const imported = new Map();
  for (const f of folder) for (const m of read(f).matchAll(/(?:from|import)\s*["']\.\.\/([a-z0-9-]+)\//g)) if (names.has(m[1]) && !imported.has(m[1])) imported.set(m[1], f);
  for (const [dep, f] of imported) if (!spec.dependencies.includes(dep)) err(`${tag} ${f} imports from ${dep}, but "${dep}" is not in the spec's dependencies`);
  for (const dep of spec.dependencies) if (!imported.has(dep)) err(`${tag} lists "${dep}" in dependencies, but none of its files imports from it`);
}

/* shared recipes (components/lib): no spec and no adapter; components compose them. Their motion
 * comes from the tokens and they carry no ui-* class. */
if (!only.size) {
  for (const name of SHARED_RECIPES) {
    const tag = `[${name} (shared recipe)]`;
    if (names.has(name)) { err(`${tag} a component of the same name exists`); continue; }
    let recipe = null;
    try { recipe = await loadRecipe(name); } catch (e) { err(`${tag} ${recipePath(name)} cannot be loaded: ${e.message.split("\n")[0]}`); continue; }
    if (!recipe) { err(`${tag} ${recipePath(name)} is missing`); continue; }
    for (const cls of recipeClasses([recipe.base, recipe.slots, recipe.variants, recipe.compoundVariants, recipe.compoundSlots])) {
      const why = classProblem(cls); if (why) err(`${tag} ${recipePath(name)} "${cls}": ${why}`);
      if (/(^|[^\w-])ui-[a-z]/.test(cls)) err(`${tag} ${recipePath(name)} "${cls}": no ui-* class (name a part by [data-slot=…])`);
    }
  }
}

/* the same rules over the source as a project would have it: the adapters, and the examples (which
 * are app code: there an icon-only button must be named) */
if (!only.size) {
  const sources = (dir, keep) => fs.readdirSync(path.join(ROOT, dir), { recursive: true }).map((f) => `${dir}/${f}`).filter((f) => /\.(tsx|vue|svelte)$/.test(f) && keep(f));
  const scan = (file, app) => {
    const text = read(file);
    const allowed = allowedLines(text);
    const found = [...scanClasses(text, rules).filter((f) => !f.advice), ...(app ? unnamedIconControls(text) : [])];
    for (const f of found) if (!allowed.has(f.line)) err(`[check] ${file}:${f.line} ${f.rule}: ${f.message}`);
  };
  for (const f of sources(COMPONENTS, (x) => !x.includes("node_modules"))) scan(f, f.includes("/examples/"));
  sources("showcases", (f) => !f.includes("node_modules")).forEach((f) => scan(f, true));
}

/* a part that exists as a component is never redrawn inside another one: composition findings are errors */
for (const x of await reportComposition([...only])) err(`[composition] ${x.file} ${x.slot}: ${x.check}: ${x.message} ("${x.cls}")`);
for (const e of errors) console.error("error", e);
console.log(`${specs.length} specs · ${errors.length} errors · 0 warnings`);
process.exit(errors.length ? 1 : 0);
