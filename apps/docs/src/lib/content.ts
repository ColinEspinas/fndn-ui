/* The repository's files as the docs read them: the component folders (components/<name>/: spec,
 * fixtures, examples, recipe, logic, adapters), components/lib/, the showcases, guides, stylesheets.
 * Server only (pages, endpoints, the data modules of lib/).
 *
 * Read with `fs`, never imported: an import (a JSON import, `?raw`, `import.meta.glob`) puts the
 * file in Vite's module graph, and a save of any such file would reload every open page of the dev
 * server, over and over while someone edits. Read here, a save
 * reloads nothing; the next request reads the new content. In dev each read checks the file's
 * mtime (a file that has not changed is not read again); in a build every file is read once.
 *
 * Paths are relative to the repository root, which is found from the working directory (the dev
 * server and the build run in apps/docs; the built chunks live elsewhere, so `import.meta.url`
 * cannot be used). Lists are sorted as `import.meta.glob` sorts them (by path), so what the pages
 * derive from them comes out in a stable order. */
import fs from "node:fs";
import path from "node:path";

function findRoot(): string {
  for (let dir = process.cwd(); ; ) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml")) && fs.existsSync(path.join(dir, "components", "lib"))) return dir;
    const up = path.dirname(dir);
    if (up === dir) throw new Error(`docs: no repository root (pnpm-workspace.yaml and components/lib) above ${process.cwd()}`);
    dir = up;
  }
}
export const ROOT = findRoot();

/** In a build nothing changes while it runs: every result is kept. In dev, files are checked. */
const LIVE = import.meta.env.DEV;

type Entry = { stamp: string; text: string; json?: unknown };
const cache = new Map<string, Entry>();
const stampOf = (abs: string) => { const s = fs.statSync(abs); return `${s.mtimeMs}:${s.size}`; };

function entry(rel: string): Entry {
  const abs = path.join(ROOT, rel);
  const hit = cache.get(abs);
  if (hit && !LIVE) return hit;
  const stamp = stampOf(abs);
  if (hit && hit.stamp === stamp) return hit;
  const e: Entry = { stamp, text: fs.readFileSync(abs, "utf8") };
  cache.set(abs, e);
  return e;
}

/** A file's text (as `?raw` gives it). */
export const readText = (rel: string): string => entry(rel).text;
/** A JSON file, parsed once per version of the file (as a JSON import gives it: one shared object). */
export const readJson = <T>(rel: string): T => { const e = entry(rel); return (e.json ??= JSON.parse(e.text)) as T; };
export const exists = (rel: string): boolean => fs.existsSync(path.join(ROOT, rel));

/* ── glob: "components/*\/*.json", "components/*\/examples/*.{tsx,vue}", "docs/**\/*.md" ── */
const segment = (s: string) =>
  new RegExp(`^${s.replace(/[.+^$()|[\]\\]/g, "\\$&").replace(/\{([^}]+)\}/g, (_, alts: string) => `(?:${alts.split(",").join("|")})`).replace(/\*/g, "[^/]*")}$`);

function walk(dir: string, parts: string[], out: string[]): void {
  const [head, ...rest] = parts;
  if (head === undefined) return;
  let names: fs.Dirent[];
  try { names = fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }); } catch { return; }
  if (head === "**") {
    walk(dir, rest, out);
    for (const d of names) if (d.isDirectory()) walk(`${dir}/${d.name}`, parts, out);
    return;
  }
  const re = segment(head);
  for (const d of names) {
    if (!re.test(d.name)) continue;
    if (rest.length) { if (d.isDirectory()) walk(`${dir}/${d.name}`, rest, out); }
    else if (d.isFile()) out.push(`${dir}/${d.name}`);
  }
}

/** The files matching a glob (`*`, `{a,b}` and a `**` segment), sorted by path. */
export function glob(spec: string): string[] {
  const parts = spec.split("/");
  const fixed: string[] = [];
  while (parts.length > 1 && !/[*{]/.test(parts[0]!)) fixed.push(parts.shift()!);
  const out: string[] = [];
  walk(fixed.join("/"), parts, out);
  return [...new Set(out)].sort();
}

/* ── derived data, recomputed only when one of its files changed (or a file came or went) ── */
const derived = new Map<string, { sig: string; value: unknown }>();

/** `compute(files)` for the files matching `globs`, kept until one of them changes. */
export function derive<T>(key: string, globs: string[], compute: (files: string[]) => T): T {
  const hit = derived.get(key);
  if (hit && !LIVE) return hit.value as T;
  const files = globs.flatMap(glob);
  const sig = LIVE ? files.map((f) => `${f}@${stampOf(path.join(ROOT, f))}`).join("|") : "";
  if (hit && hit.sig === sig) return hit.value as T;
  const value = compute(files);
  derived.set(key, { sig, value });
  return value;
}

/** The folder name of a file ("components/button/button.json" → "button") and its base name. */
export const dirOf = (rel: string) => rel.split("/").at(-2)!;
export const baseOf = (rel: string) => rel.split("/").at(-1)!;
/** The component a file of components/<name>/ belongs to ("components/card/examples/x.tsx" → "card"). */
export const componentOf = (rel: string) => rel.split("/")[1]!;
