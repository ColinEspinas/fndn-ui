// The docs site: static pages from the specs, React islands for everything live.
// Astro 7 (https://docs.astro.build/en/reference/configuration-reference/), React through
// @astrojs/react 7, Tailwind 4 through its Vite plugin (no Astro integration since Tailwind 4).
// Vue and Svelte are here for their compilers: the stage mounts the Vue and Svelte adapters inside
// the React island (src/lib/mount-vue.ts, mount-svelte.ts).
// In dev the same server serves the bare page the browser tests drive, /harness.html (src/harness).
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vue from "@astrojs/vue";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

/* The site's own plugins, loaded anew each time this file is. Astro reads its config again when
 * it is saved, but Node keeps every module it has already imported: imported the plain way, a
 * change to one of these files would wait until the server is started again. */
const fresh = (file) => import(`${file}?t=${Date.now()}`);
const [{ toAdapterFiles }, { docsModules }, { docsLiveReload }, { harnessPage }, { docsPreload }, { docsChunks }] = await Promise.all([
  fresh("./src/lib/ui-imports.mjs"),
  fresh("./src/lib/vite-modules.mjs"),
  fresh("./src/lib/vite-live-reload.mjs"),
  fresh("./src/harness/serve.mjs"),
  fresh("./src/lib/build-preload.mjs"),
  fresh("./src/lib/build-chunks.mjs"),
]);

const here = path.dirname(fileURLToPath(import.meta.url));

/* The components (components/<name>/, one folder each; components/lib/ for what they share). The
 * site imports them by path, `@fndn/components/card/card.tsx`; their npm dependencies (Ark UI,
 * Phosphor, tailwind-variants) are the dependencies of components/package.json. */
const componentsDir = path.resolve(here, "../../components");
const showcasesDir = path.resolve(here, "../../showcases");

/* The stage wraps Vue and Svelte renders in Ark's LocaleProvider. Ark is a dependency of
 * components/; resolve `@ark-ui/vue|svelte` exactly as the adapters do (same module, same context). */
function arkFromComponents() {
  return {
    name: "docs:ark-from-components",
    enforce: "pre",
    async resolveId(id, importer, options) {
      const m = /^@ark-ui\/(vue|svelte)(\/|$)/.exec(id);
      if (!m || (importer && !importer.startsWith(here))) return null;
      return this.resolve(id, path.join(componentsDir, "lib/tv.ts"), { ...options, skipSelf: true });
    },
  };
}

/* The example files (components/<name>/examples/*) and the showcases import from the adapter
 * packages' root (`import { Button } from "@fndn/react"`). The root re-exports every component, so the
 * bundle of one example would carry all of them: this splits such a line into one import per adapter
 * file (src/lib/ui-imports.mjs). It loads the file itself; the React, Vue and Svelte plugins compile it. */
const isExample = (id) => (id.startsWith(componentsDir + path.sep) && id.split(path.sep).at(-2) === "examples") || id.startsWith(showcasesDir + path.sep);
function examplesImports() {
  return {
    name: "docs:examples-imports",
    enforce: "pre",
    load(id) {
      if (!isExample(id) || id.includes("?") || !/\.(tsx|vue|svelte)$/.test(id)) return null;
      this.addWatchFile(id);
      return toAdapterFiles(fs.readFileSync(id, "utf8"));
    },
  };
}

export default defineConfig({
  /* docsPreload: the built pages list the scripts they will load (src/lib/build-preload.mjs) */
  integrations: [react(), vue(), svelte(), docsPreload(path.resolve(here, "../.."))],
  server: { port: 4321 },
  /* the client router serves a click from memory: every link is fetched on hover or focus (on the
   * built site lib/warm.ts does this instead, see src/lib/build-preload.mjs) */
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  devToolbar: { enabled: false },
  vite: {
    /* docsChunks: how the built site's scripts are grouped into files (src/lib/build-chunks.mjs) */
    plugins: [tailwindcss(), arkFromComponents(), examplesImports(), docsModules(path.resolve(here, "../..")), docsLiveReload(path.resolve(here, "../..")), harnessPage(), docsChunks(path.resolve(here, "../..").split(path.sep).join("/"))],
    resolve: {
      alias: [{ find: /^@fndn\/components\//, replacement: componentsDir + "/" }],
      dedupe: ["react", "react-dom", "@ark-ui/react", "vue", "svelte"],
    },
    // Svelte libraries ship .svelte sources; the Svelte plugin compiles them, esbuild must not pre-bundle them
    optimizeDeps: { exclude: ["phosphor-svelte", "@ark-ui/svelte", "@fndn/svelte"] },
    // the components, the packages, the specs and the fonts live outside this app
    server: {
      fs: { allow: ["../.."] },
      hmr: { overlay: false },
      /* compiled when the server starts, not when the first page asks: a test must not wait for it */
      warmup: { clientFiles: ["./src/harness/main.ts", "./src/lib/mount-{react,vue,svelte}.{ts,tsx}", "../../components/*/*.{tsx,vue,svelte}"] },
    },
  },
});
