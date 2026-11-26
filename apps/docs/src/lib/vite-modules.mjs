/* The modules the browser loads by name: the example files
 * (components/<name>/examples/<file>.tsx|vue|svelte), the adapters the stage mounts
 * (components/<name>/<file>.tsx|vue|svelte) and the showcase apps (showcases/<app>/App.tsx), as
 * virtual modules:
 *
 *   virtual:docs-examples/react          { button: () => import("virtual:docs-examples/react/button"), … }
 *   virtual:docs-examples/react/button   { "save-changes": () => import("/…/components/button/examples/save-changes.tsx"), … }
 *   virtual:docs-adapters/react          { "button.tsx": () => import("/…/components/button/button.tsx"), … }
 *   virtual:docs-showcase                { "web-app": () => import("/…/showcases/web-app/App.tsx"), … }
 *
 * Examples come in two levels: a page carries a short list of names and loads one component's list
 * when it shows that component's examples (an `import.meta.glob` over every example put every
 * example's chunk and preload list into each page's bundle, ~100 KB). Each file stays a module of
 * its own: its framework's plugin compiles it, and a save of it is a hot update of that module only.
 *
 * On the server the lists are empty: nothing renders these there, and a list the server knew put
 * every file it names in the server's module graph, where Astro reloads every open page when any of
 * them is saved (astro:hmr-reload: a server module the browser has not loaded).
 *
 * In dev a save of a component's spec, test fixtures or example tells the open pages its name
 * (custom event `docs:content`, { name }): they drop what they keep of it (lib/spec-cache.ts,
 * the example sources), so the next visit shows the new content without a reload.
 *
 * In dev the folders are watched: when a file comes or goes, the lists are updated in place (each
 * list accepts its own update and copies it into the object its importers hold), so an open page
 * neither reloads nor misses the new file. A folder is a component once it has its spec, whatever
 * was saved first: a spec that comes or goes updates every list of its folder, and the site's
 * list of pages with them. */
import fs from "node:fs";
import path from "node:path";

const EXAMPLES = "virtual:docs-examples/";
const ADAPTERS = "virtual:docs-adapters/";
const SHOWCASE = "virtual:docs-showcase";
const EXT = { react: "tsx", vue: "vue", svelte: "svelte" };

/* a list module: `files` is the object importers keep; an update replaces its entries */
const listModule = (entries) => `export const files = {
${entries.map(([k, target]) => `  ${JSON.stringify(k)}: () => import(${JSON.stringify(target)}),`).join("\n")}
};
if (import.meta.hot) import.meta.hot.accept((next) => {
  if (!next) return;
  for (const k of Object.keys(files)) if (!(k in next.files)) delete files[k];
  Object.assign(files, next.files);
});
`;

const ls = (dir, opts) => { try { return fs.readdirSync(dir, opts); } catch { return []; } };

/** `root`: the repository root. */
export function docsModules(root) {
  const components = path.join(root, "components");
  const showcase = path.join(root, "showcases");
  const ofExt = (fw) => (f) => f.endsWith(`.${EXT[fw]}`);
  /* the component folders (lib/ is not one: it has no spec) */
  const folders = () => ls(components, { withFileTypes: true }).filter((d) => d.isDirectory() && fs.existsSync(path.join(components, d.name, `${d.name}.json`))).map((d) => d.name).sort();
  const examplesOf = (name) => path.join(components, name, "examples");
  const exampleNames = (fw) => folders().filter((n) => ls(examplesOf(n)).some(ofExt(fw)));
  const exampleFiles = (fw, name) => ls(examplesOf(name)).filter(ofExt(fw)).sort();

  function list(id) {
    if (id === SHOWCASE)
      return ls(showcase, { withFileTypes: true }).filter((d) => d.isDirectory() && fs.existsSync(path.join(showcase, d.name, "App.tsx")))
        .map((d) => d.name).sort().map((n) => [n, path.join(showcase, n, "App.tsx")]);
    if (id.startsWith(ADAPTERS)) {
      const fw = id.slice(ADAPTERS.length);
      return EXT[fw] ? folders().flatMap((n) => ls(path.join(components, n)).filter(ofExt(fw)).map((f) => [f, path.join(components, n, f)])).sort((a, b) => a[0].localeCompare(b[0])) : [];
    }
    const [fw, name] = id.slice(EXAMPLES.length).split("/");
    if (!EXT[fw]) return [];
    if (!name) return exampleNames(fw).map((n) => [n, `${EXAMPLES}${fw}/${n}`]);
    return exampleFiles(fw, name).map((f) => [f.slice(0, -EXT[fw].length - 1), path.join(examplesOf(name), f)]);
  }
  const ours = (id) => id.startsWith(EXAMPLES) || id.startsWith(ADAPTERS) || id === SHOWCASE;

  return {
    name: "docs:modules",
    resolveId(id) {
      return ours(id) ? `\0${id}` : null;
    },
    load(id) {
      if (!id.startsWith("\0") || !ours(id.slice(1))) return null;
      return listModule(this.environment?.config.consumer === "server" ? [] : list(id.slice(1)));
    },
    configureServer(server) {
      server.watcher.add([components, showcase]);
      /* the component whose spec this file is (components/<name>/<name>.json) */
      const specOf = (file) => {
        const rel = path.relative(components, file).split(path.sep);
        return rel[0] !== ".." && rel.length === 2 && rel[1] === `${rel[0]}.json` ? rel[0] : null;
      };
      /* the lists a file that came or went belongs to */
      const listsOf = (file) => {
        /* a spec: its folder's adapters and examples were not listed before it, or no longer are */
        const component = specOf(file);
        if (component) return Object.keys(EXT).flatMap((k) => [`${ADAPTERS}${k}`, `${EXAMPLES}${k}`, `${EXAMPLES}${k}/${component}`]);
        const fw = Object.keys(EXT).find((k) => file.endsWith(`.${EXT[k]}`));
        if (!fw) return [];
        const s = path.relative(showcase, file).split(path.sep);
        if (s.length === 2 && s[1] === "App.tsx" && s[0] !== "..") return [SHOWCASE];
        const rel = path.relative(components, file).split(path.sep);
        if (rel[0] === "..") return [];
        if (rel.length === 2) return [`${ADAPTERS}${fw}`];
        if (rel.length === 3 && rel[1] === "examples") return [`${EXAMPLES}${fw}/${rel[0]}`, `${EXAMPLES}${fw}`];
        return [];
      };
      const changed = (file) => {
        const client = server.environments.client;
        for (const id of listsOf(file)) {
          const mod = client.moduleGraph.getModuleById(`\0${id}`);
          if (mod) void client.reloadModule(mod);
        }
        /* The pages: Astro keeps each route's list of paths until it is told the content changed
         * (the event its own content collections send to the server side), and the specs are read
         * from disk, outside its module graph. Told here, a new component has its page at once. */
        if (specOf(file)) for (const [name, environment] of Object.entries(server.environments)) if (name !== "client") environment.hot.send("astro:content-changed", {});
      };
      server.watcher.on("add", changed);
      server.watcher.on("unlink", changed);
      /* the component a saved spec, fixtures or example belongs to */
      server.watcher.on("all", (event, file) => {
        if (event !== "change" && event !== "add" && event !== "unlink") return;
        const rel = path.relative(components, file).split(path.sep);
        if (rel[0] === ".." || rel[0] === "lib" || rel.length < 2) return;
        const [name] = rel;
        const content = rel.length === 2 ? rel[1] === `${name}.json` || rel[1] === `${name}.fixtures.json` : rel.length === 3 && rel[1] === "examples";
        if (content) server.environments.client.hot.send({ type: "custom", event: "docs:content", data: { name } });
      });
    },
  };
}
