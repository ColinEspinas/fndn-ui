// init, add, remove, status and update: what the tool writes into a project.
//
// The files land in the project's ui folder as the library has them: one folder per component,
// lib/ for what they share, the same relative imports. Nothing is rewritten, so a file can be
// compared with the library by its hash.
// A file the project has changed is never overwritten unless asked.
import fs from "node:fs";
import path from "node:path";
import { catalog, closure, component, indexOf, library, styles, targetsOf, STYLES_DIR } from "./catalog.js";
import { COMMAND } from "./render.js";
import { CONFIG, FRAMEWORKS, SHAPES, configCss, createProject, defaultDir, detectFrameworks, findRoot, hash, libraryImports, openProject, packageManager, projectFiles, stateOf, tailwindStylesheets } from "./project.js";

export class UsageError extends Error {}

const SKILL_DIR = new URL("../data/skill/", import.meta.url);
/* The system is drawn for these two typefaces (tracking, tabular figures, the type scale). They are
 * the open-source variable fonts, served from the project itself. */
const FONTS = { "@fontsource-variable/inter": "^5.3.0", "@fontsource-variable/jetbrains-mono": "^5.3.0" };
const AGENTS_NOTE = `
## UI components

This project uses the fndn/ui component system. Before building or changing UI, read
\`.claude/skills/fndn/SKILL.md\` and follow it: components are found, read, added and checked with
\`${COMMAND}\` (\`search\`, \`docs\`, \`add\`, \`check\`).
`;

export function requireProject(from) {
  const project = openProject(from);
  if (!project) throw new UsageError(`No ${CONFIG} here. Set the project up first: fndn init`);
  return project;
}

/* ── writing ──────────────────────────────────────────────────────────────────────────────── */

/**
 * Brings `wanted` ({ file: content }) into the project and returns what happened to each file:
 * created, updated (it was still the library's), kept (already current) or skipped (the project
 * changed it; `overwrite` replaces it anyway).
 */
function write(project, wanted, { overwrite = false, dryRun = false } = {}) {
  const result = { created: [], updated: [], kept: [], skipped: [] };
  for (const [file, content] of Object.entries(wanted)) {
    const target = project.abs(file);
    const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null;
    const known = project.config.files[file];
    let action;
    if (current === null) action = "created";
    else if (current === content) action = "kept";
    else if (overwrite || (known && hash(current) === known)) action = "updated";
    else action = "skipped";
    result[action].push(file);
    if (action === "skipped" || dryRun) continue;
    if (action !== "kept") { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, content); }
    project.config.files[file] = hash(content);
  }
  return result;
}

/** The packages the files import that the project does not have yet, as one install command. */
function missingPackages(project, npm) {
  const have = project.dependencies();
  const { versions } = library(project.config.framework);
  const ranges = { ...versions, ...FONTS };
  const wanted = [...npm, ...(project.config.fonts ? Object.keys(FONTS) : [])];
  const missing = wanted.filter((p) => !(p in have)).map((p) => (ranges[p] ? `${p}@${ranges[p]}` : p));
  return missing.length ? `${packageManager(project.root)} ${missing.join(" ")}` : null;
}

/* ── init ─────────────────────────────────────────────────────────────────────────────────── */

/** The stylesheet files of a project: the library's, with config.css written from its fndn.json. */
const stylesOf = (project) => ({ ...styles(), [`${STYLES_DIR}/config.css`]: configCss(project.config) });

/** Sets a project up: fndn.json, the stylesheet and the fonts, their imports after Tailwind, the
 * agent skill. Run again with --shape, it changes the app's shape. */
export function init(from, { framework, dir, skill = true, fonts = true, shape } = {}) {
  if (shape !== undefined && !SHAPES.includes(shape)) throw new UsageError(`--shape is ${SHAPES.join(" or ")}`);
  const root = findRoot(from);
  const existing = openProject(root);
  if (!existing) {
    const found = detectFrameworks(root);
    framework ??= found.length === 1 ? found[0] : null;
    if (!FRAMEWORKS.includes(framework)) {
      throw new UsageError(found.length > 1
        ? `package.json names several frameworks (${found.join(", ")}): say which with --framework`
        : `No framework found in package.json: say which with --framework ${FRAMEWORKS.join("|")}`);
    }
  }
  const project = existing ?? createProject(root, { framework, dir: (dir ?? defaultDir(root, framework)).replace(/\/+$/, ""), fonts, shape });
  if (existing && shape !== undefined) project.config.shape = shape;
  const notes = [];
  const written = write(project, stylesOf(project));

  /* the system's stylesheet is imported once, right after Tailwind */
  const index = project.rel(`${STYLES_DIR}/index.css`);
  const sheets = tailwindStylesheets(root, project.config.dir);
  if (sheets.length === 1) {
    const sheet = sheets[0];
    const css = fs.readFileSync(sheet, "utf8");
    const spec = path.posix.relative(path.posix.dirname(path.relative(root, sheet).split(path.sep).join("/")), index);
    /* after Tailwind: the fonts the tokens name, then the system's stylesheet */
    const wanted = [...(project.config.fonts ? Object.keys(FONTS).map((f) => `@import "${f}";`) : []), `@import "${spec.startsWith(".") ? spec : `./${spec}`}";`];
    const added = wanted.filter((line) => !css.includes(line));
    if (!added.length) notes.push(`${path.relative(root, sheet)} already imports the stylesheet.`);
    else {
      fs.writeFileSync(sheet, css.replace(/(@import\s+["']tailwindcss["'][^;]*;)/, `$1\n${added.join("\n")}`));
      notes.push(`Added to ${path.relative(root, sheet)}, after Tailwind: ${added.map((l) => `\`${l}\``).join(" ")}`);
    }
  } else if (!sheets.length) {
    notes.push(`No stylesheet imports Tailwind yet. The components need Tailwind 4: install tailwindcss and @tailwindcss/vite, then in your global stylesheet write \`@import "tailwindcss";\` followed by \`@import "<path to>/${index}";\`.`);
  } else {
    notes.push(`Several stylesheets import Tailwind (${sheets.map((s) => path.relative(root, s)).join(", ")}): add \`@import "<path to>/${index}";\` after Tailwind in the global one.`);
  }

  if (skill && fs.existsSync(SKILL_DIR)) {
    const target = path.join(root, ".claude/skills/fndn");
    fs.cpSync(SKILL_DIR, target, { recursive: true });
    notes.push("Wrote the agent skill to .claude/skills/fndn/ (the rules for building with these components).");
    /* agents that do not load skills read AGENTS.md: point them at it */
    const agents = path.join(root, "AGENTS.md");
    if (fs.existsSync(agents) && !fs.readFileSync(agents, "utf8").includes(".claude/skills/fndn/SKILL.md")) {
      fs.appendFileSync(agents, AGENTS_NOTE);
      notes.push("Added a section to AGENTS.md that points agents at the skill.");
    }
  }
  project.save();
  const install = missingPackages(project, ["tailwind-variants"]);
  return { project, written, notes, install, created: !existing };
}

/* ── add ──────────────────────────────────────────────────────────────────────────────────── */

/** Adds components: their files and everything those import. `options.files` names more library
 * files to bring along. */
export function add(from, names, options = {}) {
  const project = requireProject(from);
  const { framework } = project.config;
  const unknown = names.filter((n) => !component(n));
  if (unknown.length) throw new UsageError(`Unknown component${unknown.length > 1 ? "s" : ""}: ${unknown.join(", ")}. See what exists: fndn search`);
  const absent = names.filter((n) => !targetsOf(component(n)).includes(framework));
  if (absent.length) throw new UsageError(`Not available for ${framework}: ${absent.join(", ")}`);

  const { files, npm, components } = closure(framework, names);
  const lib = library(framework);
  const wanted = { ...stylesOf(project), ...Object.fromEntries([...files, ...(options.files ?? []).filter((f) => lib.files[f])].map((f) => [f, lib.files[f].content])) };
  const written = write(project, wanted, options);
  if (!options.dryRun) {
    project.config.components = [...new Set([...project.config.components, ...names])].sort();
    project.save();
  }
  /* what came along: the components the asked ones are built from, when this brought them */
  const included = components.filter((name) => !names.includes(name) && written.created.includes(indexOf(name))).sort();
  return { project, written, included, install: missingPackages(project, npm) };
}

/* ── remove ───────────────────────────────────────────────────────────────────────────────── */

const CODE = /\.(ts|tsx|js|jsx|mjs|vue|svelte|astro|mdx)$/;

/**
 * What the project's own code imports from the library: `components` ({ name: [the files that
 * import it] }) and `files` (lib/ files, a borrowed recipe). Its own code is every source file the
 * tool did not write, or that the project has changed since; the folders of the components in
 * `except` are not read.
 */
function ownImports(project, lib, except) {
  const dir = path.join(project.root, project.config.dir) + path.sep;
  const components = {}, files = new Set();
  for (const file of projectFiles(project.root)) {
    if (!CODE.test(file)) continue;
    const inside = file.startsWith(dir) ? file.slice(dir.length).split(path.sep).join("/") : null;
    if (inside && (except.includes(inside.split("/")[0]) || (inside in project.config.files && stateOf(project, inside) === "pristine"))) continue;
    for (const { target } of libraryImports(project, file, fs.readFileSync(file, "utf8"))) {
      const hit = [target, `${target}.ts`, `${target}.tsx`, `${target}/index.ts`].find((f) => f in project.config.files && lib.files[f]);
      if (!hit) continue;
      const [folder] = hit.split("/");
      if (lib.components[folder]) (components[folder] ??= new Set()).add(path.relative(project.root, file).split(path.sep).join("/"));
      else files.add(hit);
    }
  }
  return { components: Object.fromEntries(Object.entries(components).map(([name, by]) => [name, [...by].sort()])), files };
}

/**
 * Removes components: every file they brought that nothing else needs. It never breaks the
 * project. What stays:
 *   - a component that a remaining one is built from, or that the project's own code imports (a
 *     page, a component of its own): `stays` says which and why, with the importing files
 *     relative to the project's root, and the second kind is from then on a component the
 *     project asked for;
 *   - a lib/ file the project's own code imports: the tool keeps it up to date as before;
 *   - a file of a removed component that the project has changed (`left`). The tool forgets it:
 *     it is the project's to keep or delete.
 * `also` names the components that went because only the removed ones were built from them.
 */
export function remove(from, names) {
  const project = requireProject(from);
  const { framework, components, files: recorded } = project.config;
  const lib = library(framework);
  const installed = closure(framework, components);
  const absent = names.filter((n) => !installed.components.includes(n));
  if (absent.length) throw new UsageError(`Not in this project: ${absent.join(", ")}. What it has: fndn status`);

  const rest = components.filter((n) => !names.includes(n));
  const own = ownImports(project, lib, names);
  /* a component only the project's own code still needs becomes one the project asked for */
  const promoted = Object.keys(own.components).filter((n) => !closure(framework, rest).components.includes(n));
  const asked = [...rest, ...promoted].sort();
  const after = closure(framework, asked);
  const keep = new Set(after.files);
  const visit = (file) => { if (!keep.has(file)) { keep.add(file); lib.files[file].imports.forEach(visit); } };
  own.files.forEach(visit);

  const stays = [...new Set([...names, ...promoted])].filter((n) => keep.has(indexOf(n))).map((name) => ({
    name,
    components: asked.filter((c) => c !== name && closure(framework, [c]).components.includes(name)),
    files: own.components[name] ?? [],
  }));

  const candidates = installed.files.filter((f) => f in recorded && !keep.has(f));
  const removed = candidates.filter((f) => stateOf(project, f) === "pristine");
  const left = candidates.filter((f) => stateOf(project, f) === "modified");
  for (const file of removed) fs.rmSync(project.abs(file));
  for (const file of candidates) delete recorded[file];
  /* the folders this emptied */
  for (const dir of new Set(removed.map((f) => path.posix.dirname(f)))) {
    if (!fs.readdirSync(project.abs(dir)).length) fs.rmdirSync(project.abs(dir));
  }
  project.config.components = asked;
  project.save();

  const also = installed.components.filter((n) => !names.includes(n) && removed.includes(indexOf(n)));
  /* the packages only the removed files imported */
  const imported = new Set([...keep, ...left].flatMap((f) => lib.files[f].npm));
  const unused = installed.npm.filter((p) => !imported.has(p) && p in project.dependencies());
  return { project, removed, left, stays, also, unused };
}

/* ── status and update ────────────────────────────────────────────────────────────────────── */

/** Where every file the tool wrote stands: changed by the project, or behind the library. */
export function status(from) {
  const project = requireProject(from);
  const lib = library(project.config.framework);
  const current = { ...stylesOf(project), ...Object.fromEntries(Object.entries(lib.files).map(([f, v]) => [f, v.content])) };
  const modified = [], missing = [], outdated = [];
  for (const [file, known] of Object.entries(project.config.files)) {
    const state = stateOf(project, file);
    if (state === "missing") missing.push(file);
    else if (state === "modified") modified.push(file);
    else if (file in current && hash(current[file]) !== known) outdated.push(file);
  }
  const installed = closure(project.config.framework, project.config.components);
  const included = installed.components.filter((name) => !project.config.components.includes(name)).sort();
  return { project, version: catalog().version, modified, missing, outdated, included, install: missingPackages(project, installed.npm) };
}

/** Brings every file the tool wrote up to the library's current one: the components asked for,
 * and the lib/ files `remove` kept for the project's own components. */
export function update(from, options = {}) {
  const project = requireProject(from);
  return add(from, project.config.components, { ...options, files: Object.keys(project.config.files) });
}
