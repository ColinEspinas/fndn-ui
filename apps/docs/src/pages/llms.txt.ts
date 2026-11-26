/* /llms.txt: what the system is, how to install, and one line per page with its Markdown link. */
import type { APIRoute } from "astro";
import { docs, href, text } from "./_agent-docs";

export const GET: APIRoute = () => text(docs().llmsTxt(href));
