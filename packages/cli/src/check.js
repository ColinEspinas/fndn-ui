// `fndn check`: reads a project's source and reports what breaks the system's rules (rules.js).
//
// Errors are things the rules forbid outright. Advice is where a rule usually applies but only
// the author can tell: it is printed, and does not fail the check.
//
// A line that carries a `fndn-check-ok: reason` comment, or follows one, is not reported.
// Files the tool wrote and the project has not changed are the library's, and are skipped.
import fs from "node:fs";
import path from "node:path";
import { catalog, library } from "./catalog.js";
import { COMMAND } from "./render.js";
import { allowedLines, classRules, keyframeNames, lintMotion, scanClasses, unnamedIconControls, withoutComments } from "./rules.js";
import { libraryImports, projectFiles, stateOf } from "./project.js";
import { requireProject } from "./add.js";

const SOURCE = /\.(tsx|jsx|ts|js|mjs|vue|svelte|astro|html|mdx)$/;
const STYLE = /\.(css|pcss)$/;
const MARKUP = /\.(tsx|jsx|vue|svelte|astro)$/;

/** <style> blocks of a Vue or Svelte file, with the line each starts on. */
function styleBlocks(text) {
  return [...text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map((m) => ({ css: m[1], offset: text.slice(0, m.index + m[0].indexOf(m[1])).split("\n").length - 1 }));
}

/** Controls written by hand where the system has the component. */
function rawControls(text) {
  const findings = [];
  withoutComments(text).split("\n").forEach((line, i) => {
    for (const m of line.matchAll(/<(button|select|textarea)(?=[\s/>])/g)) {
      findings.push({ rule: "compose", advice: true, line: i + 1, message: `a hand-written <${m[1]}>: the ${m[1]} component carries the system's sizes, press, focus ring and keyboard behaviour (fndn docs ${m[1]})` });
    }
  });
  return findings;
}

/** Imports of a library component the project does not have: used, and never added. */
function missingComponents(project, file, text, known) {
  const dir = path.join(project.root, project.config.dir);
  return libraryImports(project, file, text)
    .map(({ target, line }) => ({ name: target.split("/")[0], line }))
    .filter(({ name }) => known.has(name) && !fs.existsSync(path.join(dir, name)))
    .map(({ name, line }) => ({ rule: "missing", line, message: `imports the ${name} component, which is not in the project: ${COMMAND} add ${name}` }));
}

/** A component the project wrote in its ui folder follows the library's shape: <name>/ holds
 * <name>.recipe.ts, the adapter and an index. */
function shapeFindings(file, text) {
  const recipe = /^([a-z0-9-]+)\.recipe\.ts$/.exec(path.basename(file));
  if (!recipe) return [];
  const name = recipe[1];
  const dir = path.dirname(file);
  const pascal = name.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
  const adapter = [`${name}.tsx`, `${pascal}.vue`, `${pascal}.svelte`].map((f) => path.join(dir, f)).find((f) => fs.existsSync(f));
  /* a recipe on its own is a shared one, composed by others */
  if (!adapter) return [];
  const findings = [];
  if (path.basename(dir) !== name) findings.push({ rule: "shape", line: 1, message: `a component lives in a folder of its own name: ${name}/${name}.recipe.ts, its adapter and an index.ts` });
  if (!/from\s+["']\.\.\/lib\/tv["']/.test(text)) findings.push({ rule: "shape", line: 1, message: 'a recipe takes `tv` from "../lib/tv", which knows the token classes; tailwind-variants on its own would keep both `text-md` and `text-xs`' });
  if (!new RegExp(`data-slot=["'{]+${name}["'}]`).test(fs.readFileSync(adapter, "utf8"))) findings.push({ rule: "shape", line: 1, message: `${path.basename(adapter)} does not mark its root data-slot="${name}": parts are found and styled by data-slot` });
  if (!fs.existsSync(path.join(dir, "index.ts"))) findings.push({ rule: "shape", line: 1, message: `${name}/ has no index.ts: app code imports a component from its folder (export the adapter there)` });
  return findings;
}

/**
 * Checks the project (or only `paths` inside it).
 * @returns {{ findings: {file, line, rule, message, advice?}[], checked: string[], library: number, modified: string[] }}
 */
export function check(from, paths = []) {
  const project = requireProject(from);
  const { root, config } = project;
  const rules = classRules(catalog().tokens);
  const sharedKeyframes = keyframeNames(catalog().styles["base.css"]);
  const known = new Set(Object.keys(library(config.framework).components));
  const libraryDir = path.join(root, config.dir) + path.sep;
  const ours = new Set(Object.keys(config.files).map((f) => project.abs(f)));
  const modified = Object.keys(config.files).filter((f) => stateOf(project, f) === "modified");
  const pristine = (file) => ours.has(file) && !modified.includes(path.relative(libraryDir, file).split(path.sep).join("/"));

  const starts = paths.length ? paths.map((p) => path.resolve(root, p)) : [root];
  const files = starts.flatMap((p) => (fs.statSync(p).isDirectory() ? [...projectFiles(p)].filter((f) => SOURCE.test(f) || STYLE.test(f)) : [p]));
  const findings = [];
  const checked = [];
  let untouched = 0;
  for (const file of files) {
    if (pristine(file)) { untouched++; continue; }
    const text = fs.readFileSync(file, "utf8");
    const allowed = allowedLines(text);
    const inLibrary = file.startsWith(libraryDir);
    const found = [];
    if (STYLE.test(file)) found.push(...lintMotion(text, { sharedKeyframes }));
    else {
      found.push(...scanClasses(text, rules));
      for (const { css, offset } of styleBlocks(text)) found.push(...lintMotion(css, { sharedKeyframes }).map((f) => ({ ...f, line: f.line + offset })));
      if (MARKUP.test(file)) {
        found.push(...unnamedIconControls(text));
        if (!inLibrary) found.push(...rawControls(text));
      }
      if (inLibrary) found.push(...shapeFindings(file, text));
      found.push(...missingComponents(project, file, text, known));
    }
    const rel = path.relative(root, file).split(path.sep).join("/");
    checked.push(rel);
    for (const f of found) if (!allowed.has(f.line)) findings.push({ file: rel, ...f });
  }
  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  return { findings, checked, library: untouched, modified: modified.map((f) => project.rel(f)) };
}

/** The result as text: one line per finding, errors first, then what to do. */
export function report({ findings, checked, library, modified }) {
  const errors = findings.filter((f) => !f.advice), advice = findings.filter((f) => f.advice);
  const line = (f) => `${f.file}:${f.line}  ${f.rule}  ${f.message}`;
  const out = [];
  if (errors.length) out.push(...errors.map(line), "");
  if (advice.length) out.push("Advice (does not fail the check):", ...advice.map(line), "");
  if (modified.length) out.push(`Changed since the tool wrote them (now the project's own, checked like any file): ${modified.join(", ")}`, "");
  const read = checked.length <= 12 ? `Read: ${checked.join(", ") || "nothing"}.` : `Read ${checked.length} files.`;
  out.push(`${read}${library ? ` Not read: ${library} library files the project has not changed.` : ""}`);
  out.push(errors.length
    ? `${errors.length} error${errors.length > 1 ? "s" : ""}. The rules and their reasons: fndn docs rules. A line that must break one carries a comment \`fndn-check-ok: <reason>\`.`
    : "No errors.");
  return out.join("\n");
}
