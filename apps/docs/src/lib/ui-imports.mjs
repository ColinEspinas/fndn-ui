/* The example files (components/<name>/examples/*) and the showcases import components the way the
 * adapter packages export them, from one root: `import { Button, Tooltip } from "@fndn/react"`. The
 * root re-exports every component, so the bundle of one example would carry all of them: for the
 * browser (astro.config.mjs, examplesImports) this splits such a line into one import per adapter
 * file, by its absolute path in components/<name>/. (The code the site displays is rewritten by
 * the tool's own toProjectImports, lib/examples.ts.)
 *
 * Node only (reads the generated indexes packages/<fw>/src/index.ts and the adapters from disk). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exportedNames } from "../../../../packages/cli/src/imports.js";

/* the workspace root: this module is bundled into the build's server chunks, so it is found from
 * the working directory (the docs app or the root), not from this file's URL */
function findRoot() {
  for (let d = process.cwd(); ; d = path.dirname(d)) {
    if (fs.existsSync(path.join(d, "pnpm-workspace.yaml"))) return d;
    if (path.dirname(d) === d) return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
  }
}
export const ROOT = findRoot();

/** name exported by @fndn/<fw> → { abs: the adapter file that exports it, def: it is the file's default export }. */
function buildTable(fw) {
  const indexDir = path.join(ROOT, "packages", fw, "src");
  const index = fs.readFileSync(path.join(indexDir, "index.ts"), "utf8");
  const table = new Map();
  if (fw === "react") {
    /* `export * from "../../../components/card/card"`: every name the file exports */
    for (const m of index.matchAll(/^export\s+\*\s+from\s+"([^"]+)"/gm)) {
      const base = path.resolve(indexDir, m[1]);
      const abs = [`${base}.tsx`, `${base}.ts`, base].find((f) => fs.existsSync(f));
      if (!abs) continue;
      for (const name of exportedNames("react", path.basename(abs), fs.readFileSync(abs, "utf8"))) table.set(name, { abs, def: false });
    }
    return table;
  }
  /* Vue and Svelte: the index names every export and its file */
  for (const m of index.matchAll(/^export\s+(type\s+)?\{([^}]*)\}\s+from\s+"([^"]+)"/gm)) {
    const abs = path.resolve(indexDir, m[3]);
    for (const n of m[2].split(",")) {
      const part = n.trim();
      if (!part) continue;
      const [orig, alias] = part.split(/\s+as\s+/);
      table.set(alias ?? orig, { abs, def: orig === "default" });
    }
  }
  return table;
}

const tables = {};
const tableOf = (fw) => (tables[fw] ??= buildTable(fw));
/** Forget the tables (an adapter file was added or changed in development). */
export const resetImportTables = () => { for (const k of Object.keys(tables)) delete tables[k]; };

const IMPORT = /^([ \t]*)import\s+(type\s+)?\{([^}]*)\}\s+from\s+["']@fndn\/(react|vue|svelte)["'];?[ \t]*$/gm;
const names = (list) => list.split(",").map((s) => s.trim()).filter(Boolean);

/** For the bundler: the root imports of @fndn/<fw> in `code` as imports of the adapter files, by
 * absolute path. A line that names something the indexes do not know is left as it is (the bundler
 * reports it). */
export function toAdapterFiles(code) {
  return code.replace(IMPORT, (line, indent, typeOnly, list, fw) => {
    const table = tableOf(fw);
    const byFile = new Map();
    for (const n of names(list)) {
      const type = !!typeOnly || n.startsWith("type ");
      const name = n.replace(/^type\s+/, "");
      const hit = table.get(name);
      if (!hit) return line;
      if (!byFile.has(hit.abs)) byFile.set(hit.abs, []);
      byFile.get(hit.abs).push({ name, type, def: hit.def });
    }
    return [...byFile].map(([abs, specs]) => {
      const defs = specs.filter((s) => s.def && !s.type);
      const named = specs.filter((s) => !s.def || s.type);
      const lines = [];
      if (defs.length) lines.push(`import ${defs[0].name} from ${JSON.stringify(abs)};`);
      if (named.length) lines.push(`import { ${named.map((s) => (s.type ? `type ${s.name}` : s.name)).join(", ")} } from ${JSON.stringify(abs)};`);
      return indent + lines.join(" ");
    }).join("\n");
  });
}
