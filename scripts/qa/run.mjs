// One command for every check, run in parallel, on what changed.
//
//   node scripts/qa/run.mjs select menu     everything that concerns these components
//   node scripts/qa/run.mjs                 the components whose files changed since their last green run
//   node scripts/qa/run.mjs --all           the whole suite (what a release needs)
//
//   --fast      inner loop: interaction scripts in react only, no worst-case sweep
//   --jobs N    browsers at once (default 8)
//   --no-types  skip the typechecks
//   --list      print what would run and stop
//   --accept    record the current files as green without running anything (only for a change
//               that cannot alter a check, such as a metadata field in every spec)
//
// What runs: build-indexes, validate, the typechecks, then per component the same-DOM check
// (parity, and parity after every scenario step), its interaction script and the worst-case sweep
// on both data sets. A component is re-checked when one of its own files changed, when a helper
// it imports changed, or when something it is built from changed. A change to a shared file
// (base.css, tokens, the harness, the driver) re-checks everything.
//
// Output: one line per check. A failing check prints its failing lines; full logs are in
// .cache/qa/. A green run records the state of the components it covered in .cache/qa/state.json
// (--fast runs do not: they are not the full check). Needs the docs dev server (pnpm docs, or
// DOCS_URL): it serves the test page the checks drive (/harness.html) and the live examples a few
// of them read.
import { loadSpecs, targetsOf, adapterFiles, FRAMEWORKS, COMPONENTS, testPath } from "../lib.mjs";
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BASE = process.env.DOCS_URL ?? "http://localhost:4321";
const CACHE = path.join(ROOT, ".cache/qa");
const STATE = path.join(CACHE, "state.json");
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const jobsAt = argv.indexOf("--jobs");
const JOBS = jobsAt >= 0 ? Math.max(1, Number(argv[jobsAt + 1]) || 8) : 8;
const named = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--jobs");
const ALL = flag("--all");
const FAST = flag("--fast");

const rel = (...p) => path.join(ROOT, ...p);
const exists = (p) => fs.existsSync(rel(p));
const read = (p) => (exists(p) ? fs.readFileSync(rel(p)) : Buffer.alloc(0));
const sha = (...bufs) => { const h = crypto.createHash("sha1"); for (const b of bufs) h.update(b); return h.digest("hex").slice(0, 16); };
const walk = (dir) => (exists(dir) ? fs.readdirSync(rel(dir), { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)])) : []);

/* ── what belongs to a component ─────────────────────────────────────────── */
/* A component is its folder, components/<name>/: every file directly in it (spec, fixtures, recipe,
 * logic, adapters, test). Its examples/ are docs material, not part of what the tests render. */
const specs = loadSpecs().map((s) => s.spec);
const names = specs.map((s) => s.name).sort();
const ownFiles = (n) => fs.readdirSync(rel(COMPONENTS, n), { withFileTypes: true }).filter((d) => d.isFile()).map((d) => path.join(COMPONENTS, n, d.name)).sort();
/* What another component's folder holds that makes it a dependency rather than a helper: its spec,
 * recipe and adapters (spec.dependencies covers those). Its other files (logic) are helpers. */
const surfaceOf = Object.fromEntries(specs.map((s) => [s.name, new Set([`${s.name}.json`, `${s.name}.recipe.ts`, ...FRAMEWORKS.flatMap((fw) => adapterFiles(s, fw))].map((f) => path.join(COMPONENTS, s.name, f)))]));
/* helpers a component imports (components/lib/glide.ts, another component's logic), followed
 * through the helpers themselves */
const helpersOf = (n) => {
  const own = ownFiles(n);
  const seen = new Set();
  const visit = (file) => {
    const dir = path.dirname(file);
    for (const m of read(file).toString().matchAll(/from\s+["'](\.\.?\/[\w./-]+)["']/g)) {
      const base = path.join(dir, m[1]);
      const hit = [base, `${base}.ts`, `${base}.tsx`, `${base}.svelte.ts`].find((c) => exists(c) && fs.statSync(rel(c)).isFile());
      if (!hit || seen.has(hit) || own.includes(hit)) continue;
      const [, owner] = hit.split(path.sep);
      if (surfaceOf[owner]?.has(hit)) continue;
      seen.add(hit);
      visit(hit);
    }
  };
  own.filter((f) => /\.(tsx?|vue|svelte)$/.test(f)).forEach(visit);
  return [...seen].sort();
};
/* files that concern every component */
const SHARED = [
  "packages/core/css/base.css", "packages/core/css/tokens.css", "packages/core/css/tailwind.css", "packages/core/css/index.css",
  "spec/tokens.json", "spec/icons.json",
  "components/lib/tv.ts", "scripts/lib.mjs",
  "scripts/qa/cdp.mjs", "scripts/qa/parity.mjs", "scripts/qa/worst.mjs", "scripts/validate.mjs",
  ...walk("apps/docs/src/harness"), "apps/docs/src/lib/mount-react.tsx", "apps/docs/src/lib/mount-vue.ts", "apps/docs/src/lib/mount-svelte.ts",
  "apps/docs/src/lib/render.tsx", "apps/docs/src/lib/Render.svelte", "apps/docs/src/lib/types.ts", "apps/docs/src/styles/fonts.css", "apps/docs/astro.config.mjs",
].filter(exists);

const hashOf = (files) => sha(...files.flatMap((f) => [Buffer.from(f), read(f)]));
const now = { shared: hashOf(SHARED), components: Object.fromEntries(names.map((n) => [n, hashOf([...ownFiles(n), ...helpersOf(n)])])) };
const before = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, "utf8")) : { components: {} };

/* a component is also affected by what it is built from */
const depsOf = Object.fromEntries(specs.map((s) => [s.name, s.dependencies ?? []]));
const withDependents = (set) => {
  const out = new Set(set);
  for (let grew = true; grew;) {
    grew = false;
    for (const n of names) if (!out.has(n) && depsOf[n].some((d) => out.has(d))) { out.add(n); grew = true; }
  }
  return [...out].sort();
};

const sharedChanged = now.shared !== before.shared;
let targets;
let why;
if (ALL) { targets = names; why = "--all"; }
else if (named.length) {
  const unknown = named.filter((n) => !names.includes(n));
  if (unknown.length) { console.error(`no such component: ${unknown.join(", ")}`); process.exit(2); }
  targets = withDependents(named); why = "named, with what is built from them";
} else if (sharedChanged) { targets = names; why = "a shared file changed"; }
else { targets = withDependents(names.filter((n) => now.components[n] !== before.components?.[n])); why = "changed since their last green run"; }
const everything = targets.length === names.length;

/* ── the checks ──────────────────────────────────────────────────────────── */
/* scripts that measure frame times: they run alone, after everything else, on a quiet machine */
const SOLO = new Set(["records-table"]);
const chunk = (list, n) => { const out = Array.from({ length: Math.min(n, list.length) }, () => []); list.forEach((x, i) => out[i % out.length].push(x)); return out; };
const node = (label, args, { summary = /\d+ (examples|frames|cases|specs)|all (targets )?pass|failed|failure/ } = {}) => ({ label, cmd: "node", args, summary });
const tasks = [];
const pre = [node("indexes", ["scripts/build-indexes.mjs"]), node("validate", ["scripts/validate.mjs", ...(everything ? [] : targets)])];
if (!flag("--no-types")) {
  /* @fndn/components checks the adapters of all three frameworks in one script */
  for (const pkg of ["@fndn/core", "@fndn/components", "docs", "showcases"]) tasks.push({ label: `types ${pkg}`, cmd: "pnpm", args: ["--filter", pkg, "typecheck"], summary: /error|ERRORS/i, light: true });
}
if (targets.length) {
  const groups = chunk(targets, Math.max(1, Math.min(JOBS, Math.ceil(targets.length / 4))));
  groups.forEach((g, i) => tasks.push(node(`parity ${i + 1}/${groups.length}`, ["scripts/qa/parity.mjs", ...g])));
  groups.forEach((g, i) => tasks.push(node(`steps ${i + 1}/${groups.length}`, ["scripts/qa/parity.mjs", "--steps", ...g])));
  /* a component's own script is told its frameworks on the command line: the spec's targets (all
   * three when it lists none), react only under --fast; a component without react has nothing to run then */
  for (const n of targets) {
    const fws = targetsOf(specs.find((s) => s.name === n)).filter((fw) => !FAST || fw === "react");
    if (exists(testPath(n)) && fws.length) tasks.push({ ...node(n, [testPath(n), ...fws]), solo: SOLO.has(n) });
  }
  if (!FAST) {
    groups.forEach((g, i) => tasks.push(node(`worst ${i + 1}/${groups.length}`, ["scripts/qa/worst.mjs", ...g])));
    groups.forEach((g, i) => tasks.push(node(`worst-demo ${i + 1}/${groups.length}`, ["scripts/qa/worst.mjs", "--demo", ...g])));
  }
}
if (ALL || (!named.length && sharedChanged)) for (const s of ["foundation", "glide"]) if (exists(`scripts/qa/${s}.mjs`)) tasks.push(node(s, [`scripts/qa/${s}.mjs`]));
/* The smoke test of the docs site's own pages (scripts/qa/docs.mjs). */
if (ALL && process.env.DOCS_SMOKE !== "0" && (await fetch(`${BASE}/`).then((r) => r.ok, () => false))) tasks.push(node("docs", ["scripts/qa/docs.mjs"], { summary: /docs: |failed|failure/ }));

console.log(`${targets.length} component${targets.length === 1 ? "" : "s"} (${why})${targets.length && !everything ? `: ${targets.join(" ")}` : ""}`);
if (flag("--accept")) {
  fs.mkdirSync(CACHE, { recursive: true });
  const next = { shared: everything ? now.shared : before.shared, components: { ...before.components } };
  for (const n of targets) next.components[n] = now.components[n];
  fs.writeFileSync(STATE, JSON.stringify(next, null, 1));
  console.log("recorded as green WITHOUT running the checks");
  process.exit(0);
}
if (flag("--list")) { for (const t of [...pre, ...tasks]) console.log(`  ${t.label}`); process.exit(0); }
if (!targets.length && !tasks.some((t) => !t.light)) { console.log("nothing changed since the last green run"); process.exit(0); }

fs.mkdirSync(CACHE, { recursive: true });
const started = Date.now();
const run = (t) => new Promise((resolve) => {
  const t0 = Date.now();
  const log = path.join(CACHE, `${t.label.replace(/[^\w.-]+/g, "_")}.log`);
  const out = fs.createWriteStream(log);
  const child = spawn(t.cmd, t.args, { cwd: ROOT, env: { ...process.env, FORCE_COLOR: "0" } });
  child.stdout.pipe(out); child.stderr.pipe(out);
  child.on("close", (code) => out.end(() => {
    const lines = fs.readFileSync(log, "utf8").split("\n").filter((l) => l.trim());
    const ok = code === 0;
    const last = [...lines].reverse().find((l) => t.summary.test(l)) ?? lines[lines.length - 1] ?? "";
    console.log(`${ok ? "✓" : "✗"} ${t.label.padEnd(22)} ${String(Math.round((Date.now() - t0) / 1000)).padStart(4)}s  ${ok ? last.trim().slice(0, 110) : ""}`);
    if (!ok) {
      const bad = lines.filter((l) => /✗|error|Error|not ok|problem/.test(l) && !/0 problems|0 errors|0 ERRORS/.test(l));
      for (const l of (bad.length ? bad : lines.slice(-8)).slice(0, 12)) console.log(`    ${l.trim().slice(0, 260)}`);
      console.log(`    log: ${path.relative(ROOT, log)}`);
    }
    resolve(ok);
  }));
});

/* the dev server must answer before any browser starts, and have compiled the test page: a
 * server that has just started answers each of these only once the module is ready */
const up = await fetch(`${BASE}/harness.html`).then((r) => r.ok, () => false);
if (!up && tasks.some((t) => !t.light)) { console.error(`the docs dev server is not answering on ${BASE} (pnpm docs; a built preview has no test page)`); process.exit(2); }
if (up) await Promise.all(["harness/main.ts", "harness/harness.css", "lib/mount-react.tsx", "lib/mount-vue.ts", "lib/mount-svelte.ts"].map((f) => fetch(`${BASE}/src/${f}`).then((r) => r.text(), () => "")));

let failed = 0;
for (const t of pre) if (!(await run(t))) failed++;
if (failed) { console.log("stopped: fix the validator first"); process.exit(1); }
const queue = tasks.filter((t) => !t.solo);
await Promise.all(Array.from({ length: JOBS }, async () => { for (let t; (t = queue.shift());) if (!(await run(t))) failed++; }));
for (const t of tasks.filter((x) => x.solo)) if (!(await run(t))) failed++;

const secs = Math.round((Date.now() - started) / 1000);
if (failed) { console.log(`\n${failed} check${failed === 1 ? "" : "s"} failed · ${secs}s`); process.exit(1); }
if (!FAST) {
  const next = { shared: everything ? now.shared : before.shared, components: { ...before.components } };
  for (const n of targets) next.components[n] = now.components[n];
  fs.writeFileSync(STATE, JSON.stringify(next, null, 1));
}
console.log(`\nall green · ${targets.length} component${targets.length === 1 ? "" : "s"} · ${secs}s${FAST ? " (fast run: not recorded)" : ""}`);
