/* The search palette's index (components, blocks, foundations, guides), fetched when it first opens. */
import type { APIRoute } from "astro";
import { searchIndex } from "../lib/catalog";

export const GET: APIRoute = () => new Response(JSON.stringify(searchIndex()), { headers: { "content-type": "application/json" } });
