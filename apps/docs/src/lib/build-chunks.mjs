/* How the built site's scripts are grouped into files (the client build only, so nothing changes
 * in development; Rolldown's `output.codeSplitting.groups`,
 * https://rolldown.rs/in-depth/manual-code-splitting).
 *
 * Left to itself the bundler cuts a file wherever the set of pages and islands that import a module
 * changes, which here makes ~2,000 files, most under 2 kB: a component page asked for ~150 of them.
 * A page asks for few files instead, each holding what is always loaded together:
 *   - `site`: everything the layout's islands import (components/Shell.ts: the top bar, the tree,
 *     the menu button), at any depth: the site's own modules, the components the bar and the
 *     palette are made of, with their share of Ark, Zag and components/lib, and Astro's router.
 *     Every page loads it, once;
 *   - `component-page`: what the islands of a component page import beyond that
 *     (components/ComponentPage.ts);
 *   - each framework's runtime (React with its DOM renderer and Astro's React client; Vue; Svelte),
 *     and each framework's icons: one file of every icon the site uses (~65 kB over the wire in
 *     React), instead of a file per icon, 20 to 30 on a page;
 *   - one component: its recipe and logic, its React adapter, and the Ark component and Zag machine
 *     of the same name; its Vue adapter (with Ark Vue's component) and its Svelte adapter (with Ark
 *     Svelte's) in a file of their own, so a page in React never loads them;
 *   - one component's examples in one framework, with their list (lib/vite-modules.mjs): a
 *     component page shows all of them;
 *   - what is left of Zag's shared helpers, of Ark's shared parts per framework and of
 *     components/lib once `site` has taken its share;
 *   - one showcase app.
 * A page still loads only the components it shows. What only another page's island imports (the
 * installation page's, a foundation's) is left to the bundler, which keeps it with that island. */
import path from "node:path";

/** The modules the layout's islands and a component page's islands come from. */
const SITE = "Shell.ts";
const PAGE = "ComponentPage.ts";
const PAGE_FILE = "component-page";
/** The Zag packages every interactive component shares (the others are one component's machine). */
const ZAG_SHARED = new Set(["core", "dom-query", "utils", "types", "anatomy", "dismissable", "focus-trap", "focus-visible", "interact-outside", "popper", "remove-scroll", "aria-hidden", "live-region", "i18n-utils", "collection", "auto-resize", "presence"]);
/** The Ark component folders several components build on. */
const ARK_SHARED = new Set(["presence", "portal", "collection", "field", "fieldset"]);
const FW_SUFFIX = { react: "", vue: "-vue", svelte: "-svelte" };
const ICONS = { "@phosphor-icons/react": "icons", "@phosphor-icons/vue": "icons-vue", "phosphor-svelte": "icons-svelte" };
/** the lists of examples (lib/vite-modules.mjs): one of every component's list, then one per component */
const EXAMPLES = /^\0virtual:docs-examples\/(react|vue|svelte)(?:\/([a-z0-9-]+))?$/;

/** A Vite plugin for the client build. `root`: the repository root, with forward slashes. */
export function docsChunks(root) {
  const components = `${root}/components/`;
  const showcases = `${root}/showcases/`;
  const slashed = (id) => id.replace(/\\/g, "/");
  /** the package of a file in node_modules, from the last node_modules/ of its path (pnpm nests them) */
  const packageOf = (file) => /.*\/node_modules\/((?:@[^/]+\/)?[^/]+)\/(.*)$/.exec(file);
  const isRuntime = (name) => /^(react|react-dom|scheduler|@astrojs\/react(-renderer)?)$/.test(name);
  /** What a module imports, statically, at any depth: the ids, itself and what `not` holds
   * excluded. A framework's runtime and the icons are not followed: they have files of their own,
   * and the icon package's index imports every icon, whichever ones the module uses. */
  function reach(ctx, from, not) {
    const seen = new Set(), found = new Set();
    const stack = [...from];
    while (stack.length) {
      const id = stack.pop();
      if (seen.has(id) || not?.has(id)) continue;
      seen.add(id);
      const info = ctx.getModuleInfo(id);
      const name = packageOf(slashed(id).split("?")[0])?.[1];
      if (!info || (name && (isRuntime(name) || name in ICONS))) continue;
      found.add(id);
      stack.push(...info.importedIds);
    }
    for (const id of from) found.delete(id);
    return found;
  }
  /** the two sets, worked out once per build (ids as the bundler has them) */
  let sets;
  const setsOf = (ctx) => (sets ??= (() => {
    const at = (file) => path.resolve(root, file);
    const site = reach(ctx, [at(`apps/docs/src/components/${SITE}`)]);
    return { site, page: reach(ctx, [at(`apps/docs/src/components/${PAGE}`)], site) };
  })());

  /** the group of a module id, or null to leave it to the bundler */
  function group(rawId, ctx) {
    const id = slashed(rawId);
    const [file, query = ""] = id.split("?");
    /* an entry (an island's module, one of Astro's scripts, a framework's client) stays the file
     * a page asks for: a group that takes one is named after it */
    if (ctx.getModuleInfo(rawId)?.isEntry) return null;
    const list = EXAMPLES.exec(rawId);
    if (list) return list[2] ? `${list[2]}-examples${FW_SUFFIX[list[1]]}` : null;
    const pkg = packageOf(file);
    if (pkg && isRuntime(pkg[1])) return "react";
    if (pkg && pkg[1] in ICONS) return ICONS[pkg[1]];
    const { site, page } = setsOf(ctx);
    if (site.has(rawId)) return "site";
    if (page.has(rawId)) return PAGE_FILE;
    if (pkg) {
      const [, name, rest] = pkg;
      if (name === "vue" || name.startsWith("@vue/") || /^@astrojs\/vue(-renderer)?$/.test(name)) return "vue";
      if (name === "svelte" || /^@astrojs\/svelte(-renderer)?$/.test(name)) return "svelte";
      if (name === "tailwind-variants" || name === "tailwind-merge") return "lib";
      if (name.startsWith("@floating-ui/")) return "zag";
      if (name.startsWith("@zag-js/")) {
        const z = name.slice("@zag-js/".length);
        if (z in FW_SUFFIX) return `ark${FW_SUFFIX[z]}`;
        return ZAG_SHARED.has(z) ? "zag" : z;
      }
      const ark = /^@ark-ui\/(react|vue|svelte)$/.exec(name);
      if (ark) {
        const dir = /^dist\/components\/([^/]+)\//.exec(rest)?.[1];
        return !dir || ARK_SHARED.has(dir) ? `ark${FW_SUFFIX[ark[1]]}` : `${dir}${FW_SUFFIX[ark[1]]}`;
      }
      /* Astro's router and prefetch, which its page scripts share */
      if (name === "astro" || name === "@astrojs/runtime") return "site";
      return null;
    }
    if (/^\0(virtual:)?astro:/.test(rawId)) return "site";
    if (file.startsWith(showcases)) return `showcase-${file.slice(showcases.length).split("/")[0]}`;
    if (!file.startsWith(components)) return null;
    const [folder, ...rest] = file.slice(components.length).split("/");
    if (folder === "lib") return "lib";
    const fw = file.endsWith(".vue") || query.includes("vue") ? "-vue" : file.endsWith(".svelte") || query.includes("svelte") ? "-svelte" : "";
    return rest[0] === "examples" ? `${folder}-examples${fw}` : `${folder}${fw}`;
  }
  return {
    name: "docs:chunks",
    apply: "build",
    applyToEnvironment: (env) => env.name === "client",
    buildStart() { sets = undefined; },
    /* the bundler may add exports to an island's entry file (it shares a file with modules of its
     * group), which a group that takes only its own modules requires */
    options: (opts) => ({ ...opts, preserveEntrySignatures: "allow-extension" }),
    outputOptions: (opts) => ({
      ...opts,
      /* modules run in their source order whichever file they landed in: without it, a module
       * that a group moved can run before what it imports (a Vue mount found the runtime's `h`
       * undefined, a React island an undefined component) */
      strictExecutionOrder: true,
      /* the bundler names the component page's file after the last module in it, whatever the
       * group is called: give it its name */
      chunkFileNames: (chunk) => {
        const named = sets?.page.has(chunk.moduleIds?.[0]) ? { ...chunk, name: PAGE_FILE } : chunk;
        return typeof opts.chunkFileNames === "function" ? opts.chunkFileNames(named) : (opts.chunkFileNames ?? "[name]-[hash].js").replace("[name]", named.name);
      },
      codeSplitting: {
        /* a group takes only the modules named here, not what they import: a component's file
         * must not swallow the other components it builds on */
        includeDependenciesRecursively: false,
        groups: [{ name: group }],
      },
    }),
  };
}
