/* /foundations/<id>.md: a foundations page (tokens from spec/tokens.json, icons) as Markdown. */
import type { APIRoute } from "astro";
import { FOUNDATIONS } from "../../../../../packages/cli/src/render.js";
import { docs, href, markdown } from "../_agent-docs";

export function getStaticPaths() {
  return FOUNDATIONS.map(([id]) => ({ params: { id } }));
}

export const GET: APIRoute = ({ params }) => markdown(docs().render(`/foundations/${params.id}.md`, href));
