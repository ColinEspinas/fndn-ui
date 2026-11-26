/* The example files of one component, as the docs display them (imports as `fndn add` puts
 * them in a project): { react: { "<file>": code }, vue, svelte }. The component page fetches it once,
 * so no page carries the sources in its markup. */
import type { APIRoute } from "astro";
import { specs } from "../../lib/catalog";
import { exampleSources } from "../../lib/examples";

export function getStaticPaths() {
  return specs().map((s) => ({ params: { name: s.name } }));
}

export const GET: APIRoute = ({ params }) =>
  new Response(JSON.stringify(exampleSources(params.name!)), { headers: { "content-type": "application/json" } });
