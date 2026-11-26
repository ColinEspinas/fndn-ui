/* Scoped live reload for the docs dev server: a change shows live, but a save does not reload
 * every open page.
 *
 * The pages read the repository's files with fs (lib/content.ts), so Vite does not know which page
 * a file feeds. This plugin watches components/, showcases/, spec/, docs/ and packages/core/src/,
 * maps a saved file to the pages it affects and tells the browsers (custom event `docs:reload`,
 * { pages }); lib/live-reload.ts reloads the open page only when it is one of them, once per burst
 * of saves. Module code Vite hot-updates itself (recipes, adapters, example components) keeps its
 * hot update; this only adds the reload of the pages that show the file.
 *
 *   components/<name>/<name>.json            /components/<name> (+ .md), /
 *   components/<name>/<name>.fixtures.json   /components/<name> (+ .md)
 *   components/<name>/examples/index.json    /components/<name> (+ .md), /
 *   components/<name>/examples/<file>.<ext>  / (the component page updates the example in place:
 *                                            the module by hot update, its source by
 *                                            lib/vite-modules.mjs's `docs:content`)
 *   components/<name>/<adapter>              /components/<name> (+ .md)
 *   a recipe, logic, components/lib/*        every page (they are code every page may run)
 *   showcases/<app>/*                        /showcase/<app> (+ .md)
 *   spec/tokens.json, spec/icons.json        /foundations/*
 *   docs/<id>.md                             /guides/<id> (+ .md)
 *   packages/core/src/*                      every page
 */
import path from "node:path";

const component = (name) => [`/components/${name}`, `/components/${name}.md`];

/** The pages a file affects ("*": every page; a path ending in "/": every page under it). */
export function pagesOf(root, file) {
  const rel = path.relative(root, file).split(path.sep).join("/");
  const parts = rel.split("/");
  const base = parts.at(-1);
  if (rel === "spec/tokens.json" || rel === "spec/icons.json") return ["/foundations/"];
  if (rel.startsWith("docs/") && base.endsWith(".md")) { const id = rel.slice(5, -3); return [`/guides/${id}`, `/guides/${id}.md`]; }
  if (parts[0] === "showcases" && parts.length === 3) return [`/showcase/${parts[1]}`, `/showcase/${parts[1]}.md`];
  if (parts[0] === "packages" && parts[1] === "core" && parts[2] === "src") return ["*"];
  if (parts[0] !== "components" || parts.length < 3) return [];
  const name = parts[1];
  /* code shared by components: any page may run it */
  if (name === "lib") return /\.ts$/.test(base) ? ["*"] : [];
  if (parts.length === 4 && parts[2] === "examples") {
    if (base === "index.json") return [...component(name), "/"];
    return /\.(tsx|vue|svelte)$/.test(base) ? ["/"] : [];
  }
  if (parts.length !== 3) return [];
  if (base === `${name}.json`) return [...component(name), "/"];
  if (base === `${name}.fixtures.json`) return component(name);
  if (/\.(tsx|vue|svelte)$/.test(base)) return component(name);
  if (base.endsWith(".ts") && !base.endsWith(".d.ts")) return ["*"];
  return [];
}

export function docsLiveReload(root) {
  const dirs = ["components", "showcases", "spec", "docs", "packages/core/src"].map((d) => path.join(root, d));
  return {
    name: "docs:live-reload",
    apply: "serve",
    configureServer(server) {
      server.watcher.add(dirs);
      server.watcher.on("all", (event, file) => {
        if ((event !== "change" && event !== "add" && event !== "unlink") || !dirs.some((d) => file.startsWith(d + path.sep))) return;
        const pages = pagesOf(root, file);
        if (pages.length) server.environments.client.hot.send({ type: "custom", event: "docs:reload", data: { pages, file: path.relative(root, file) } });
      });
    },
  };
}
