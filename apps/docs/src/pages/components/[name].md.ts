/* /components/<name>.md: a component or block page as Markdown (the spec, install commands, the
 * example files of components/<name>/examples/ and the recipe). */
import type { APIRoute } from "astro";
import { docs, href, markdown } from "../_agent-docs";

export function getStaticPaths() {
  return docs().specs.map((s) => ({ params: { name: s.name } }));
}

export const GET: APIRoute = ({ params }) => markdown(docs().render(`/components/${params.name}.md`, href));
