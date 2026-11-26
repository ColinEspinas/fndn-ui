// The project the tool works in: where it is, which framework it uses, where the components go,
// and what the tool has written there (fndn.json).
//
// fndn.json is the whole state:
//   framework   react | vue | svelte
//   dir         the folder that holds the library, relative to the root (src/components/ui)
//   import      how app code imports from that folder ("@/components/ui"), when an alias exists
//   fonts       whether the tool set up the system's fonts (Inter, JetBrains Mono)
//   shape       the app's shape: "pill" (buttons, toggles and segmented controls are pills) or
//               "rounded" (they take a field's corners). The tool writes it into styles/config.css
//   components  the components asked for, by name
//   files       every file the tool wrote, with the hash of what it wrote. A file whose content
//               still has that hash is the library's; any other is the project's own work.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

export const FRAMEWORKS = ["react", "vue", "svelte"];
export const CONFIG = "fndn.json";
export const SHAPES = ["pill", "rounded"];

export const hash = (content) => createHash("sha256").update(content).digest("hex").slice(0, 16);
const readJson = (file) => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; } };

/** The nearest folder, from `from` upwards, that holds fndn.json; failing that, a package.json. */
export function findRoot(from = process.cwd()) {
  const up = (file) => {
    for (let dir = path.resolve(from); ; dir = path.dirname(dir)) {
      if (fs.existsSync(path.join(dir, file))) return dir;
      if (dir === path.dirname(dir)) return null;
    }
  };
  return up(CONFIG) ?? up("package.json") ?? path.resolve(from);
}

function dependencies(root) {
  const pkg = readJson(path.join(root, "package.json")) ?? {};
  return { ...pkg.peerDependencies, ...pkg.devDependencies, ...pkg.dependencies };
}

/** The frameworks the project's package.json names. Svelte and Vue projects never list react. */
export function detectFrameworks(root) {
  const deps = dependencies(root);
  return FRAMEWORKS.filter((fw) => fw in deps || (fw === "svelte" && "@sveltejs/kit" in deps) || (fw === "react" && "next" in deps) || (fw === "vue" && "nuxt" in deps));
}

export function defaultDir(root, framework) {
  if (framework === "svelte") return "src/lib/components/ui";
  return fs.existsSync(path.join(root, "src")) ? "src/components/ui" : "components/ui";
}

/** The alias app code imports the folder by, read from the project's own configuration. */
export function detectImport(root, dir, framework) {
  /* SvelteKit's own alias; a plain Svelte project has only what its tsconfig says */
  if (framework === "svelte" && dir.startsWith("src/lib/") && "@sveltejs/kit" in dependencies(root)) return `$lib/${dir.slice("src/lib/".length)}`;
  for (const file of ["tsconfig.json", "tsconfig.app.json", "jsconfig.json"]) {
    /* tsconfig files may carry comments and trailing commas */
    let text; try { text = fs.readFileSync(path.join(root, file), "utf8"); } catch { continue; }
    const paths = /"paths"\s*:\s*\{([^}]*)\}/.exec(text)?.[1] ?? "";
    for (const m of paths.matchAll(/"([^"*]+)\/\*"\s*:\s*\[\s*"([^"*]+)\/\*"/g)) {
      const target = path.posix.normalize(m[2]).replace(/^\.\//, "");
      if (dir === target || dir.startsWith(`${target}/`)) return `${m[1]}${dir.slice(target.length)}`;
    }
  }
  return null;
}

export function packageManager(root) {
  const has = (f) => fs.existsSync(path.join(root, f));
  if (has("pnpm-lock.yaml")) return "pnpm add";
  if (has("yarn.lock")) return "yarn add";
  if (has("bun.lock") || has("bun.lockb")) return "bun add";
  return "npm install";
}

/** The project as the commands use it, or null when `fndn init` has not run. */
export function openProject(from) {
  const root = findRoot(from);
  const config = readJson(path.join(root, CONFIG));
  if (!config) return null;
  return {
    root,
    config: { ...config, components: config.components ?? [], files: config.files ?? {} },
    abs: (rel) => path.join(root, config.dir, rel),
    rel: (file) => path.posix.join(config.dir, file),
    dependencies: () => dependencies(root),
    save() { fs.writeFileSync(path.join(root, CONFIG), JSON.stringify(this.config, null, 2) + "\n"); },
  };
}

export function createProject(root, { framework, dir, fonts = true, shape = "pill" }) {
  const config = { framework, dir, import: detectImport(root, dir, framework), fonts, shape, components: [], files: {} };
  fs.writeFileSync(path.join(root, CONFIG), JSON.stringify(config, null, 2) + "\n");
  return openProject(root);
}

/** What a file the tool once wrote is now: missing, pristine (the library's) or modified. */
export function stateOf(project, file) {
  let content; try { content = fs.readFileSync(project.abs(file), "utf8"); } catch { return "missing"; }
  return hash(content) === project.config.files[file] ? "pristine" : "modified";
}

const SKIP_DIRS = new Set(["node_modules", "dist", "build", "out", "coverage", "public", "static"]);

/** Every file of the project, without what is installed, built or hidden. */
export function* projectFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* projectFiles(file);
    else yield file;
  }
}

const IMPORT = /(?:\bfrom\s+|\bimport\s+|\bimport\(\s*)["']([^"']+)["']/g;

/** Where the imports of a file land inside the ui folder ("button", "lib/tv", "button/Button.vue"),
 * through a relative path or the project's alias for the folder: [{ target, line }]. */
export function libraryImports(project, file, text) {
  const dir = path.join(project.root, project.config.dir);
  const alias = project.config.import;
  const found = [];
  for (const m of text.matchAll(IMPORT)) {
    const specifier = m[1];
    let target = null;
    if (specifier.startsWith(".")) {
      const rel = path.relative(dir, path.resolve(path.dirname(file), specifier)).split(path.sep).join("/");
      if (rel && !rel.startsWith("..")) target = rel;
    } else if (alias && specifier.startsWith(`${alias}/`)) target = specifier.slice(alias.length + 1);
    if (target) found.push({ target, line: text.slice(0, m.index).split("\n").length });
  }
  return found;
}

/** The project's stylesheets that import Tailwind: the system's stylesheet is imported there too. */
export function tailwindStylesheets(root, libraryDir) {
  const found = [];
  const skip = new Set(["node_modules", "dist", "build", path.resolve(root, libraryDir)]);
  const walk = (dir, depth) => {
    if (depth > 4) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.name.startsWith(".") || skip.has(entry.name) || skip.has(file)) continue;
      if (entry.isDirectory()) walk(file, depth + 1);
      else if (/\.(css|pcss)$/.test(entry.name) && /^\s*@import\s+["']tailwindcss["']/m.test(fs.readFileSync(file, "utf8"))) found.push(file);
    }
  };
  walk(root, 0);
  return found;
}

/** styles/config.css: what fndn.json says about the look, as CSS. Imported last by the stylesheet,
 * so it wins over the tokens' own values. */
export function configCss(config) {
  const head = `/* Written by the tool from ${CONFIG}: change the setting there, then run \`update\`. */\n`;
  if (config.shape !== "rounded") return `${head}/* "shape": "pill": buttons, toggles and segmented controls are pills (the tokens' own values). */\n`;
  return `${head}/* "shape": "rounded": buttons, toggles and segmented controls take a field's corners. */\n:root {\n  --fndn-radius-shape: var(--fndn-radius-control);\n  --fndn-radius-shape-sm: var(--fndn-radius-chip);\n}\n`;
}
