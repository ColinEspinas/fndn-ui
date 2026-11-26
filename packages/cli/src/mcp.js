// `fndn mcp`: the commands as tools of a Model Context Protocol server, over stdio.
//
// Written against the protocol directly (one JSON-RPC message per line), with no dependency, so
// the server starts at once. It serves both generations of the protocol:
//
//   modern (2026-07-28)   no handshake; every request names its version in `_meta`, and
//                         `server/discover` describes the server
//   legacy (2025-11-25 and earlier)   the client opens with `initialize`
//
// A request that names a version in `_meta` is modern; anything else is legacy.
import readline from "node:readline";
import { commands } from "./commands.js";
import { catalog, CATEGORIES } from "./catalog.js";
import { TOPICS } from "./docs.js";
import { UsageError } from "./add.js";
import { FRAMEWORKS } from "./project.js";

const MODERN = ["2026-07-28"];
const LEGACY = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const VERSION_KEY = "io.modelcontextprotocol/protocolVersion";
const SERVER_KEY = "io.modelcontextprotocol/serverInfo";
const UNSUPPORTED_VERSION = -32022, METHOD_NOT_FOUND = -32601, INVALID_PARAMS = -32602, INTERNAL = -32603, PARSE = -32700;

const INSTRUCTIONS = `The fndn/ui component system for React, Vue and Svelte: components that are copied into the project as source files, and the rules they follow.

Building UI in a project that uses it:
1. \`status\` tells you whether the project is set up; \`init\` sets it up.
2. \`search\` finds the component for each piece of the request. Prefer a component to hand-written markup, and a prop to a class.
3. \`docs\` with a component's name gives its contract and examples in the project's framework. Read it before using the component. \`docs\` with "design" gives the design language for laying out a screen.
4. \`add\` writes the components into the project.
5. \`check\` reports what breaks the system's rules. Run it before you call the work done, and fix every error.`;

const readOnly = { readOnlyHint: true, openWorldHint: false };
const writes = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false };

const TOOLS = [
  {
    name: "search",
    title: "Find components",
    description: "Find the components that answer a need (\"pick a date\", \"confirm a delete\", \"agent is thinking\"), best match first. Without a query: every component, grouped by category. Use it before writing any control or surface by hand.",
    inputSchema: { type: "object", properties: { query: { type: "string", description: "What the UI has to do, in a few words." }, category: { type: "string", enum: CATEGORIES.map(([id]) => id) } }, additionalProperties: false },
    annotations: readOnly,
    run: (cwd, args) => commands.search(cwd, args),
  },
  {
    name: "docs",
    title: "Read a component or a topic",
    description: `The documentation of one component (parts, props, events, keyboard, motion, examples as complete files in the project's framework) or of one topic: ${Object.entries(TOPICS).map(([t, what]) => `"${t}" (${what.toLowerCase()})`).join(", ")}. Read a component's page before using it, "design" before laying out a screen, and "authoring" before building a component the system does not have.`,
    inputSchema: { type: "object", properties: { name: { type: "string", description: "A component name from search, or a topic." }, framework: { type: "string", enum: FRAMEWORKS, description: "Defaults to the project's framework." }, examples: { type: "string", enum: ["some", "all", "none"], description: "How many examples come as complete files: the first two (default), all, or none (ids and titles only)." }, example: { type: "string", description: "The id of one example of the component, as its page lists them: only that example comes back, as a complete file." } }, required: ["name"], additionalProperties: false },
    annotations: readOnly,
    run: (cwd, args) => commands.docs(cwd, args),
  },
  {
    name: "add",
    title: "Add components to the project",
    description: "Write components into the project as source files it owns: each one's adapter and recipe, and everything they import (the components they are built from, shared recipes, helpers, the stylesheet). Returns the files written, the npm packages to install and the import line. A file the project has changed is left alone unless overwrite is true.",
    inputSchema: { type: "object", properties: { names: { type: "array", items: { type: "string" }, minItems: 1, description: "Component names from search." }, overwrite: { type: "boolean", description: "Replace files the project has changed. Their changes are lost." } }, required: ["names"], additionalProperties: false },
    annotations: writes,
    run: (cwd, args) => commands.add(cwd, args),
  },
  {
    name: "check",
    title: "Check the project against the system's rules",
    description: "Read the project's source and report what breaks the rules the components follow: colours, radii and shadows that are not tokens, motion that is not one of the motion utilities, z-index among the floating layers, icon-only buttons without a name, ungated hover in CSS. Each finding has the file, the line, the reason and what to use instead. Run it before calling a piece of UI done; fix every error. Advice is for you to judge.",
    inputSchema: { type: "object", properties: { paths: { type: "array", items: { type: "string" }, description: "Files or folders, relative to the project. Default: the whole project." } }, additionalProperties: false },
    annotations: readOnly,
    run: (cwd, args) => { const r = commands.check(cwd, args); return { text: r.text, isError: r.failed }; },
  },
  {
    name: "status",
    title: "The project's state",
    description: "Whether the project is set up, its framework and ui folder, the components it has, the files it has changed, and the files the library has improved since they were added.",
    inputSchema: { type: "object", additionalProperties: false },
    annotations: readOnly,
    run: (cwd) => commands.status(cwd),
  },
  {
    name: "init",
    title: "Set the project up",
    description: "Set a project up for the system, once: writes fndn.json, the stylesheet, the imports of the stylesheet and of the system's fonts after Tailwind, and the agent skill. The project needs Tailwind 4. Safe to run again.",
    inputSchema: { type: "object", properties: { framework: { type: "string", enum: FRAMEWORKS, description: "Only when package.json does not settle it." }, dir: { type: "string", description: "The folder for the library. Default src/components/ui (Svelte: src/lib/components/ui)." }, fonts: { type: "boolean", description: "false leaves the system's fonts (Inter, JetBrains Mono) out, for a project with its own." }, shape: { type: "string", enum: ["pill", "rounded"], description: "The app's shape, kept in fndn.json: pill (the default: buttons, toggles and segmented controls are pills) or rounded (they take a field's corners, for an editor, a tracker, a dashboard). Run again with it to change the shape." } }, additionalProperties: false },
    annotations: writes,
    run: (cwd, args) => commands.init(cwd, args),
  },
];

class RpcError extends Error {
  constructor(code, message, data) { super(message); this.code = code; this.data = data; }
}

function callTool(cwd, { name, arguments: args = {} } = {}) {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) throw new RpcError(INVALID_PARAMS, `Unknown tool: ${name}`);
  try {
    const out = tool.run(cwd, args);
    const { text, isError = false } = typeof out === "string" ? { text: out } : out;
    return { content: [{ type: "text", text }], isError };
  } catch (error) {
    /* something the model can act on (an unknown name, a project that is not set up) is a tool
     * result; anything else is the server's fault */
    if (error instanceof UsageError) return { content: [{ type: "text", text: error.message }], isError: true };
    throw error;
  }
}

/** The result of one request; throws RpcError. */
function handle(cwd, method, params = {}) {
  const serverInfo = { name: "fndn", version: catalog().version };
  const capabilities = { tools: {} };
  const declared = params._meta?.[VERSION_KEY];
  if (declared !== undefined && !MODERN.includes(declared)) {
    throw new RpcError(UNSUPPORTED_VERSION, "Unsupported protocol version", { supported: [...MODERN, ...LEGACY], requested: declared });
  }
  const complete = (result) => (declared ? { resultType: "complete", ...result } : result);
  switch (method) {
    case "server/discover":
      return { resultType: "complete", supportedVersions: [...MODERN, ...LEGACY], capabilities, instructions: INSTRUCTIONS, _meta: { [SERVER_KEY]: serverInfo } };
    case "initialize":
      return { protocolVersion: LEGACY.includes(params.protocolVersion) ? params.protocolVersion : LEGACY[0], capabilities, serverInfo, instructions: INSTRUCTIONS };
    case "ping":
      return complete({});
    case "tools/list":
      return complete({ tools: TOOLS.map(({ run, ...tool }) => tool) });
    case "tools/call":
      return complete(callTool(cwd, params));
    default:
      throw new RpcError(METHOD_NOT_FOUND, `Method not found: ${method}`);
  }
}

/** One line in, at most one line out. Exported for the tests. */
export function respond(cwd, line) {
  let message;
  try { message = JSON.parse(line); } catch { return { jsonrpc: "2.0", id: null, error: { code: PARSE, message: "Parse error" } }; }
  /* a notification (no id) is never answered */
  if (message.id === undefined || message.id === null) return null;
  try {
    return { jsonrpc: "2.0", id: message.id, result: handle(cwd, message.method, message.params) };
  } catch (error) {
    const rpc = error instanceof RpcError ? error : new RpcError(INTERNAL, error.message);
    return { jsonrpc: "2.0", id: message.id, error: { code: rpc.code, message: rpc.message, ...(rpc.data ? { data: rpc.data } : {}) } };
  }
}

/** Serves until stdin closes. stdout carries protocol messages only. */
export function serve(cwd = process.cwd()) {
  const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  lines.on("line", (line) => {
    if (!line.trim()) return;
    const reply = respond(cwd, line);
    if (reply) process.stdout.write(`${JSON.stringify(reply)}\n`);
  });
  lines.on("close", () => process.exit(0));
}
