/* Built pages only: each page names every script it will certainly load, as
 * <link rel="modulepreload">, so the browser asks for all of them at once instead of discovering
 * them one import at a time (each level of imports is another round trip to the host).
 *
 * The client build's chunk graph is read as it is written (generateBundle); once the pages are
 * written (astro:build:done), each page gets the static import closure of
 *   - its module scripts and its islands' code (component and renderer), and
 *   - on a component page, what the workbench then loads in React, the default framework, to show
 *     the stage and the first example: the component's adapter, the mount module, the two example
 *     lists (lib/vite-modules.mjs) and the first example's file, with their own static imports;
 *     and the spec it fetches (/spec/<name>.json), as a preload of that fetch.
 * A page that ends up in another framework (a stored choice) has fetched a few small files it does
 * not use; one in React finds each step of that chain already in its cache.
 *
 *   - on a showcase's page, the app's code.
 * An island hydrated when visible (the overview's cards and thumbnails) has its own code listed:
 * the overview always shows some, and the code is the same for all of them. What each one then
 * loads (its example, its app) is not: that depends on the viewport, and the three apps preloaded
 * on the overview delay the cards around them. Nothing here runs in development. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** `root`: the repository root. */
export function docsPreload(root) {
  const components = path.join(root, "components");
  const showcases = path.join(root, "showcases");
  const docsLib = path.join(root, "apps/docs/src/lib");
  /** the client bundle's chunks by file name (_astro/x.js), and the chunk of each module id */
  const chunks = new Map();
  const byModule = new Map();

  const graph = {
    name: "docs:preload-graph",
    apply: "build",
    applyToEnvironment: (env) => env.name === "client",
    generateBundle(_, bundle) {
      for (const c of Object.values(bundle)) {
        if (c.type !== "chunk") continue;
        chunks.set(c.fileName, c);
        for (const id of c.moduleIds) byModule.set(id, c.fileName);
      }    },
  };

  /** the files a list of chunks statically imports, the chunks included */
  const closure = (files, into = new Set()) => {
    for (const f of files) {
      if (!f || into.has(f) || !chunks.has(f)) continue;
      into.add(f);
      closure(chunks.get(f).imports, into);
    }
    return into;
  };
  const chunkOf = (id) => byModule.get(id);
  const asFile = (url) => url.replace(/^\//, "");

  /** a component page's chain in React (lib/render.tsx, lib/examples-live.ts, lib/example-modules.ts) */
  function workbench(dir, name) {
    let spec;
    try { spec = JSON.parse(fs.readFileSync(path.join(dir, "spec", `${name}.json`), "utf8")); } catch { return { files: [], fetches: [] }; }
    const fetches = [`/spec/${name}.json`];
    if (spec.targets && !spec.targets.includes("react")) return { files: [], fetches };
    const files = [chunkOf(path.join(components, name, spec.files?.react?.[0] ?? `${name}.tsx`))];
    const first = spec.exampleFiles?.[0]?.file;
    if (first) files.push(
      chunkOf(path.join(docsLib, "mount-react.tsx")),
      chunkOf("\0virtual:docs-examples/react"),
      chunkOf(`\0virtual:docs-examples/react/${name}`),
      chunkOf(path.join(components, name, "examples", `${first}.tsx`)),
    );
    return { files, fetches };
  }

  const htmlFiles = (dir) => fs.readdirSync(dir, { recursive: true }).filter((f) => f.endsWith(".html")).map((f) => path.join(dir, f));

  return {
    name: "docs:preload",
    hooks: {
      /* Also, on the built site, Astro's own prefetch of every link is turned off: the browser does
       * not reuse what it fetches for the router, and lib/warm.ts fetches the pages ahead itself. */
      "astro:config:setup": ({ command, updateConfig }) => {
        if (command === "build") updateConfig({ vite: { plugins: [graph] }, prefetch: { prefetchAll: false } });
      },
      "astro:build:done": ({ dir, logger }) => {
        if (!chunks.size) return;
        const out = fileURLToPath(dir);
        let pages = 0, links = 0;
        for (const file of htmlFiles(out)) {
          const html = fs.readFileSync(file, "utf8");
          const scripts = [...html.matchAll(/<script type="module" src="([^"]+)"/g)].map((m) => asFile(m[1]));
          const tags = [...html.matchAll(/<astro-island\b[^>]*>/g)].map((m) => m[0]);
          const urls = (tag) => [...tag.matchAll(/ (?:component|renderer)-url="([^"]+)"/g)].map((m) => asFile(m[1]));
          const islands = tags.filter((tag) => / client="(load|visible)"/.test(tag)).flatMap(urls);
          /* a showcase app, on its page (on the overview, where its thumbnails are hydrated when
           * visible, preloading the three apps delays the cards around them) */
          for (const tag of tags.filter((t) => / client="load"/.test(t) && / opts="[^"]*&quot;name&quot;:&quot;ShowcaseFrame&quot;/.test(t))) {
            const app = /&quot;name&quot;:\[0,&quot;([a-z0-9-]+)&quot;\]/.exec(tag)?.[1];
            islands.push(...urls(tag), chunkOf(path.join(showcases, app ?? "", "App.tsx")));
          }
          const page = /^components\/([a-z0-9-]+)\/index\.html$/.exec(path.relative(out, file).split(path.sep).join("/"));
          const chain = page ? workbench(out, page[1]) : { files: [], fetches: [] };
          const preload = closure([...scripts, ...islands, ...chain.files]);
          for (const s of scripts) preload.delete(s);
          if (!preload.size && !chain.fetches.length) continue;
          const head = [...[...preload].map((f) => `<link rel="modulepreload" href="/${f}">`), ...chain.fetches.map((u) => `<link rel="preload" as="fetch" href="${u}" crossorigin>`)].join("");
          fs.writeFileSync(file, html.replace("</head>", `${head}</head>`));
          pages++; links += preload.size;
        }
        logger.info(`modulepreload: ${links} links on ${pages} pages`);
      },
    },
  };
}
