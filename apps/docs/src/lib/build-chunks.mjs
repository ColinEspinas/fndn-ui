/* How the built site's scripts are grouped into files (the client build only, so nothing changes
 * in development; Rolldown's `output.codeSplitting.groups`,
 * https://rolldown.rs/in-depth/manual-code-splitting).
 *
 * Left to itself the bundler cuts a file wherever the set of pages and islands that import a module
 * changes, which here makes ~2,000 files, most under 2 kB: a component page asked for ~150 of them.
 * What always travels together goes into one file instead:
 *   - each framework's runtime (React with its DOM renderer and Astro's React client; Vue; Svelte);
 *   - Zag's shared helpers (the state machine core, the DOM queries, positioning, dismiss and focus
 *     helpers, collections), which every interactive component imports; and, per framework, Ark
 *     UI's shared parts (its context and locale providers, presence, portal, field);
 *   - components/lib (the shared recipes and utilities) with tailwind-variants;
 *   - one component: its recipe and logic, its React adapter, and the Ark component and Zag machine
 *     of the same name; its Vue adapter (with Ark Vue's component) and its Svelte adapter (with Ark
 *     Svelte's) in a file of their own, so a page in React never loads them;
 *   - one showcase app.
 * A page still loads only the components it shows, and each example stays a file of its own,
 * loaded when it is shown (lib/vite-modules.mjs). Everything else is left to the bundler, icons
 * included: each is a file of its own (~1 kB), as one file of every icon the site uses would be
 * ~290 kB. */

/** The Zag packages every interactive component shares (the others are one component's machine). */
const ZAG_SHARED = new Set(["core", "dom-query", "utils", "types", "anatomy", "dismissable", "focus-trap", "focus-visible", "interact-outside", "popper", "remove-scroll", "aria-hidden", "live-region", "i18n-utils", "collection", "auto-resize", "presence"]);
/** The Ark component folders several components build on. */
const ARK_SHARED = new Set(["presence", "portal", "collection", "field", "fieldset"]);
const FW_SUFFIX = { react: "", vue: "-vue", svelte: "-svelte" };

/** A Vite plugin for the client build. `root`: the repository root, with forward slashes. */
export function docsChunks(root) {
  const components = `${root}/components/`;
  const showcases = `${root}/showcases/`;
  /** the group of a module id, or null to leave it to the bundler */
  function group(rawId) {
    const id = rawId.replace(/\\/g, "/");
    const [file, query = ""] = id.split("?");
    /* the package, from the last node_modules/ of the path (pnpm nests them) */
    const pkg = /.*\/node_modules\/((?:@[^/]+\/)?[^/]+)\/(.*)$/.exec(file);
    if (pkg) {
      const [, name, rest] = pkg;
      if (/^(react|react-dom|scheduler|@astrojs\/react)$/.test(name)) return "react";
      if (name === "vue" || name.startsWith("@vue/") || name === "@astrojs/vue") return "vue";
      if (name === "svelte" || name === "@astrojs/svelte") return "svelte";
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
      return null;
    }
    if (file.startsWith(showcases)) return `showcase-${file.slice(showcases.length).split("/")[0]}`;
    if (!file.startsWith(components)) return null;
    const [folder, ...rest] = file.slice(components.length).split("/");
    if (folder === "lib") return "lib";
    if (rest[0] === "examples") return null;
    if (file.endsWith(".vue") || query.includes("vue")) return `${folder}-vue`;
    if (file.endsWith(".svelte") || query.includes("svelte")) return `${folder}-svelte`;
    return folder;
  }
  return {
    name: "docs:chunks",
    apply: "build",
    applyToEnvironment: (env) => env.name === "client",
    /* the bundler may add exports to an island's entry file (it shares a file with modules of its
     * group), which a group that takes only its own modules requires */
    options: (opts) => ({ ...opts, preserveEntrySignatures: "allow-extension" }),
    outputOptions: (opts) => ({
      ...opts,
      /* modules run in their source order whichever file they landed in: without it, a module
       * that a group moved can run before what it imports (a Vue mount found the runtime's `h`
       * undefined, a React island an undefined component) */
      strictExecutionOrder: true,
      codeSplitting: {
        /* a group takes only the modules named here, not what they import: a component's file
         * must not swallow the other components it builds on */
        includeDependenciesRecursively: false,
        groups: [{ name: group }],
      },
    }),
  };
}
