/* /llms-full.txt: every page of the docs as Markdown, in one file. */
import type { APIRoute } from "astro";
import { docs, href, text } from "./_agent-docs";

export const GET: APIRoute = () => text(docs().llmsFull(href));
