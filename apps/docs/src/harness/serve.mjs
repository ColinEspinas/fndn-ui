/* Serves the test page (harness.html, beside this file) from the docs dev server, at
 * /harness.html. It is a plain Vite page outside Astro's routes, so nothing of the docs site (its
 * layout, router or stylesheet) is on it, and it exists in dev only: the built site has no such page. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "../..");

/* the two font files in use (src/styles/fonts.css), preloaded under the exact address the
 * stylesheet asks for: main.ts waits for them, so text never paints in a fallback face */
const FONTS = [
  "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  "@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
];
const preloads = () => FONTS.map((f) => `<link rel="preload" as="font" type="font/woff2" href="/@fs${fs.realpathSync(path.join(app, "node_modules", f))}" crossorigin />`).join("\n    ");

export function harnessPage() {
  return {
    name: "docs:harness",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        /* Vite can open a file in the running editor (the link in its error overlay). A test's
         * click must never do that on the desktop of whoever runs the tests. */
        if (req.url?.startsWith("/__open-in-editor")) { res.statusCode = 204; res.end(); return; }
        if (req.url?.split("?")[0] !== "/harness.html") return next();
        try {
          const page = fs.readFileSync(path.join(here, "harness.html"), "utf8").replace("<title>", `${preloads()}\n    <title>`);
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(await server.transformIndexHtml(req.url, page));
        } catch (error) { next(error); }
      });
    },
  };
}
