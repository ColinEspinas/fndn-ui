// The commands against a throwaway project: what is written, what is left alone, what is reported.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { commands } from "../src/commands.js";
import { closure, library } from "../src/catalog.js";
import { UsageError } from "../src/add.js";
import { respond } from "../src/mcp.js";

function project(framework, files = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "fndn-test-"));
  const deps = { react: { react: "^19.0.0" }, vue: { vue: "^3.5.0" }, svelte: { svelte: "^5.0.0" } }[framework];
  const all = { "package.json": JSON.stringify({ name: "app", dependencies: deps }), "src/app.css": '@import "tailwindcss";\n', ...files };
  for (const [file, content] of Object.entries(all)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  }
  return { root, read: (f) => fs.readFileSync(path.join(root, f), "utf8"), write: (f, c) => fs.writeFileSync(path.join(root, f), c), has: (f) => fs.existsSync(path.join(root, f)) };
}

test("every file of every framework resolves its imports inside the library", () => {
  for (const fw of ["react", "vue", "svelte"]) {
    const lib = library(fw);
    for (const [file, { imports }] of Object.entries(lib.files)) for (const i of imports) assert.ok(lib.files[i], `${fw}/${file} imports ${i}`);
    for (const name of Object.keys(lib.components)) assert.ok(closure(fw, [name]).files.includes(`${name}/index.ts`), `${fw}/${name}`);
  }
});

test("a component brings only what it imports", () => {
  assert.deepEqual(closure("react", ["chip"]).files, ["chip/chip.recipe.ts", "chip/chip.tsx", "chip/index.ts", "lib/tv.ts"]);
  assert.ok(!closure("react", ["button"]).files.some((f) => f.startsWith("prompt-bar/")));
  /* a component reached through its adapter comes whole, with its index; one whose logic alone
   * is borrowed does not */
  const toggle = closure("vue", ["toggle"]);
  assert.deepEqual([...toggle.components].sort(), ["button", "kbd", "spinner", "toggle", "tooltip"]);
  assert.ok(toggle.files.includes("tooltip/index.ts"));
  const message = closure("react", ["message"]);
  assert.ok(message.files.includes("code-block/code-block.logic.ts") && !message.files.includes("code-block/index.ts"));
});

test("init sets the project up and imports the stylesheet after Tailwind", () => {
  const p = project("react", { "tsconfig.json": '{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }' });
  commands.init(p.root);
  const config = JSON.parse(p.read("fndn.json"));
  assert.equal(config.framework, "react");
  assert.equal(config.dir, "src/components/ui");
  assert.equal(config.import, "@/components/ui");
  /* after Tailwind: the fonts the tokens name, then the system's stylesheet */
  assert.equal(p.read("src/app.css"), '@import "tailwindcss";\n@import "@fontsource-variable/inter";\n@import "@fontsource-variable/jetbrains-mono";\n@import "./components/ui/styles/index.css";\n');
  assert.match(commands.status(p.root), /Not installed yet.*@fontsource-variable\/inter/);
  assert.ok(p.has("src/components/ui/styles/tokens.css"));
  assert.ok(p.has(".claude/skills/fndn/SKILL.md"));
  /* a second run changes nothing */
  commands.init(p.root);
  assert.equal(p.read("src/app.css").match(/styles\/index\.css/g).length, 1);
});

test("init leaves the fonts out when asked, and points an existing AGENTS.md at the skill", () => {
  const p = project("react", { "AGENTS.md": "# App\n" });
  const out = commands.init(p.root, { fonts: false });
  assert.equal(p.read("src/app.css"), '@import "tailwindcss";\n@import "./components/ui/styles/index.css";\n');
  assert.match(p.read("AGENTS.md"), /\.claude\/skills\/fndn\/SKILL\.md/);
  assert.match(out, /Wrote fndn\.json/);
  assert.match(out, /no import alias/);
  commands.init(p.root);
  assert.equal(p.read("AGENTS.md").match(/## UI components/g).length, 1);
});

test("the app's shape is a setting in fndn.json, written into the stylesheet", () => {
  const p = project("react");
  commands.init(p.root, {});
  const styles = "src/components/ui/styles";
  assert.equal(JSON.parse(p.read("fndn.json")).shape, "pill");
  assert.match(p.read(`${styles}/index.css`), /@import "\.\/config\.css";\n$/);
  assert.doesNotMatch(p.read(`${styles}/config.css`), /--fndn-radius-shape/);
  /* asked for when setting up, or later */
  commands.init(p.root, { shape: "rounded" });
  assert.equal(JSON.parse(p.read("fndn.json")).shape, "rounded");
  assert.match(p.read(`${styles}/config.css`), /:root \{\n  --fndn-radius-shape: var\(--fndn-radius-control\);\n  --fndn-radius-shape-sm: var\(--fndn-radius-chip\);\n\}/);
  /* changed in fndn.json itself: update writes it */
  const config = JSON.parse(p.read("fndn.json"));
  p.write("fndn.json", JSON.stringify({ ...config, shape: "pill" }, null, 2) + "\n");
  commands.update(p.root, {});
  assert.doesNotMatch(p.read(`${styles}/config.css`), /--fndn-radius-shape/);
  assert.throws(() => commands.init(p.root, { shape: "square" }), UsageError);
});

test("init needs to know the framework", () => {
  const p = project("react");
  p.write("package.json", JSON.stringify({ name: "app" }));
  assert.throws(() => commands.init(p.root), UsageError);
  assert.match(commands.init(p.root, { framework: "svelte" }), /svelte/);
  assert.equal(JSON.parse(p.read("fndn.json")).dir, "src/lib/components/ui");
});

test("add writes a component and what it is built from, each framework in its own files", () => {
  for (const [fw, adapter] of [["react", "toggle.tsx"], ["vue", "Toggle.vue"], ["svelte", "Toggle.svelte"]]) {
    const p = project(fw);
    commands.init(p.root);
    const out = commands.add(p.root, { names: ["toggle"] });
    const dir = JSON.parse(p.read("fndn.json")).dir;
    for (const f of [`toggle/${adapter}`, "toggle/index.ts", "toggle/toggle.recipe.ts", "button/index.ts", "button/button.recipe.ts", "tooltip/tooltip.recipe.ts", "lib/tv.ts", "lib/modality.ts"]) assert.ok(p.has(`${dir}/${f}`), `${fw}: ${f}`);
    assert.match(out, /built from them: .*button/);
    assert.match(out, /tailwind-variants/);
    assert.deepEqual(JSON.parse(p.read("fndn.json")).components, ["toggle"]);
  }
});

test("add refuses what does not exist, with a way forward", () => {
  const p = project("react");
  assert.throws(() => commands.add(p.root, { names: ["button"] }), /fndn init/);
  commands.init(p.root);
  assert.throws(() => commands.add(p.root, { names: ["buton"] }), /Unknown component: buton/);
  assert.throws(() => commands.add(p.root, { names: [] }), UsageError);
});

test("a file the project changed is never overwritten, unless asked", () => {
  const p = project("react");
  commands.init(p.root);
  commands.add(p.root, { names: ["chip"] });
  const file = "src/components/ui/chip/chip.recipe.ts";
  const mine = `${p.read(file)}\n// my variant\n`;
  p.write(file, mine);
  assert.match(commands.status(p.root), /Changed by the project.*chip\/chip\.recipe\.ts/);
  assert.match(commands.update(p.root), /Left alone.*chip\/chip\.recipe\.ts/);
  assert.equal(p.read(file), mine);
  commands.add(p.root, { names: ["chip"], overwrite: true });
  assert.notEqual(p.read(file), mine);
  assert.match(commands.status(p.root), /Everything the tool wrote is current/);
});

test("update rewrites a file that is still the library's", () => {
  const p = project("react");
  commands.init(p.root);
  commands.add(p.root, { names: ["chip"] });
  /* as if the library had moved on since: the recorded hash is of the older content on disk */
  const config = JSON.parse(p.read("fndn.json"));
  const file = "src/components/ui/chip/chip.tsx";
  const older = `${p.read(file)}// older\n`;
  p.write(file, older);
  config.files["chip/chip.tsx"] = createHash("sha256").update(older).digest("hex").slice(0, 16);
  p.write("fndn.json", JSON.stringify(config));
  assert.match(commands.status(p.root), /Behind the library.*chip\/chip\.tsx/);
  assert.match(commands.update(p.root), /Updated: .*chip\/chip\.tsx/);
  assert.ok(!p.read(file).includes("// older"));
});

test("remove deletes a component and what only it needed", () => {
  const p = project("react");
  commands.init(p.root);
  commands.add(p.root, { names: ["tooltip", "kbd"] });
  const ui = "src/components/ui";
  /* a component another one is built from stays */
  assert.match(commands.remove(p.root, { names: ["button"] }), /^button stays: tooltip is built from it\.$/);
  assert.ok(p.has(`${ui}/button/button.tsx`));

  const out = commands.remove(p.root, { names: ["tooltip"] });
  assert.match(out, /Removed: .*tooltip\/tooltip\.tsx/);
  assert.match(out, /Gone as well, since nothing else is built from them: button, spinner/);
  for (const gone of ["tooltip", "button", "spinner", "lib/modality.ts"]) assert.ok(!p.has(`${ui}/${gone}`), gone);
  /* what was asked for on its own, and what it imports, stays */
  assert.ok(p.has(`${ui}/kbd/kbd.tsx`) && p.has(`${ui}/lib/tv.ts`));
  const config = JSON.parse(p.read("fndn.json"));
  assert.deepEqual(config.components, ["kbd"]);
  assert.ok(!Object.keys(config.files).some((f) => f.startsWith("tooltip/") || f.startsWith("button/")));
  /* and update does not write it again */
  commands.update(p.root);
  assert.ok(!p.has(`${ui}/tooltip`));
  assert.throws(() => commands.remove(p.root, { names: ["select"] }), UsageError);
});

test("remove keeps what the project changed, and what its own components import", () => {
  const p = project("react");
  commands.init(p.root);
  commands.add(p.root, { names: ["chip", "select", "tooltip"] });
  const ui = "src/components/ui";
  p.write(`${ui}/chip/chip.recipe.ts`, `${p.read(`${ui}/chip/chip.recipe.ts`)}\n// my variant\n`);
  fs.mkdirSync(path.join(p.root, ui, "price-tag"));
  p.write(`${ui}/price-tag/price-tag.tsx`, 'import { tv } from "../lib/tv";\nimport { glideLayer } from "../lib/glide";\nimport { Spinner } from "../spinner";\nexport const parts = [tv, glideLayer, Spinner];\n');

  const out = commands.remove(p.root, { names: ["chip", "select", "tooltip"] });
  /* the changed file is left, and is the project's from now on */
  assert.match(out, /Left in place, because the project has changed it: .*chip\/chip\.recipe\.ts/);
  assert.ok(p.has(`${ui}/chip/chip.recipe.ts`) && !p.has(`${ui}/chip/chip.tsx`));
  /* a component the project's own file imports (it came with the tooltip's button) stays, as one
   * the project asked for */
  assert.match(out, /spinner stays: .*price-tag\/price-tag\.tsx imports it\./);
  const config = JSON.parse(p.read("fndn.json"));
  assert.deepEqual(config.components, ["spinner"]);
  assert.ok(!("chip/chip.recipe.ts" in config.files));
  /* so do the lib files it imports, still the library's: update keeps them current */
  assert.ok(p.has(`${ui}/lib/glide.ts`) && "lib/glide.ts" in config.files);
  assert.ok(!p.has(`${ui}/select`) && !p.has(`${ui}/lib/popup.ts`));
  const older = `${p.read(`${ui}/lib/glide.ts`)}// older\n`;
  p.write(`${ui}/lib/glide.ts`, older);
  config.files["lib/glide.ts"] = createHash("sha256").update(older).digest("hex").slice(0, 16);
  p.write("fndn.json", JSON.stringify(config));
  assert.match(commands.update(p.root), /Updated: .*lib\/glide\.ts/);
});

test("remove never breaks the project: what its code imports stays", () => {
  const p = project("vue");
  commands.init(p.root);
  commands.add(p.root, { names: ["avatar", "tooltip"] });
  p.write("src/App.vue", '<script setup lang="ts">\nimport { Avatar } from "./components/ui/avatar";\nimport { Button } from "./components/ui/button";\n</script>\n<template><Avatar name="Ada" /><Button>Save</Button></template>\n');
  /* asked to go, and still imported */
  assert.match(commands.remove(p.root, { names: ["avatar"] }), /^avatar stays: src\/App\.vue imports it\. To remove it, take it out of there first\.$/);
  assert.ok(p.has("src/components/ui/avatar/Avatar.vue"));
  /* the button came with the tooltip; the page uses it, so it becomes a component of the project's */
  const out = commands.remove(p.root, { names: ["tooltip"] });
  assert.match(out, /Removed: .*tooltip\/Tooltip\.vue/);
  assert.match(out, /button stays: src\/App\.vue imports it\./);
  assert.deepEqual(JSON.parse(p.read("fndn.json")).components, ["avatar", "button"]);
  assert.match(commands.status(p.root), /With them, because they are built from them: spinner/);
  /* an import of a component that was never added is an error of check, with the fix */
  p.write("src/Page.vue", '<script setup lang="ts">\nimport { Slider } from "./components/ui/slider";\n</script>\n<template><Slider /></template>\n');
  const { text, failed } = commands.check(p.root);
  assert.ok(failed);
  assert.match(text, /src\/Page\.vue:2 {2}missing {2}imports the slider component, which is not in the project: npx fndn add slider/);
  assert.ok(!/App\.vue.*missing/.test(text));
});

test("check reports app code, skips the library's files, and reads the project's own components", () => {
  const p = project("react");
  commands.init(p.root);
  commands.add(p.root, { names: ["button"] });
  assert.equal(commands.check(p.root).failed, false);
  /* it says what it read, and that the library's unchanged files were left out */
  p.write("src/Home.tsx", '<main className="bg-page text-ink" />\n');
  assert.match(commands.check(p.root).text, /Read: src\/Home\.tsx, src\/app\.css\. Not read: \d+ library files/);
  p.write("src/App.tsx", '<div className="rounded-lg bg-gray-100 transition-all">\n  <Button square icon={<X />} />\n  <button className="p-2">x</button>\n</div>\n');
  /* a component the project wrote itself, not yet in the library's shape */
  fs.mkdirSync(path.join(p.root, "src/components/ui/badge"));
  p.write("src/components/ui/badge/badge.recipe.ts", 'import { tv } from "tailwind-variants";\nexport const badge = tv({ base: "rounded-chip" });\n');
  p.write("src/components/ui/badge/badge.tsx", 'export const Badge = () => <span className="x" />;\n');
  const r = commands.check(p.root);
  assert.equal(r.failed, true);
  for (const expected of ["src/App.tsx:1  shape", "src/App.tsx:1  color", "src/App.tsx:1  motion", "src/App.tsx:2  name", "src/App.tsx:3  compose", "badge/badge.recipe.ts:1  shape", '"../lib/tv"', 'data-slot="badge"', "has no index.ts"]) assert.ok(r.text.includes(expected), expected);
  /* one allowed line */
  p.write("src/App.tsx", '{/* fndn-check-ok: partner brand colour */}\n<span className="bg-[#4285F4]" />\n');
  fs.rmSync(path.join(p.root, "src/components/ui/badge"), { recursive: true });
  assert.equal(commands.check(p.root).failed, false);
});

test("docs answer for the project: its framework, its import paths, its files", () => {
  const p = project("vue");
  commands.init(p.root);
  const page = commands.docs(p.root, { name: "toggle" });
  /* no alias in this project: paths as a file at the top of src/ writes them */
  assert.match(page, /import \{ Toggle \} from "\.\/components\/ui\/toggle";/);
  assert.match(page, /no import alias/);
  assert.ok(!page.includes("@/components"));
  assert.ok(!page.includes("tsx"));
  assert.match(page, /<script setup/);
  /* a component made of several files is still one import, from its folder */
  assert.match(commands.docs(p.root, { name: "card", examples: "all" }), /import \{ Card, CardDescription, CardFooter, CardHeader, CardTitle \} from "\.\/components\/ui\/card";/);
  for (const topic of ["design", "motion", "interaction", "accessibility", "authoring", "porting", "rules", "tokens", "icons", "install"]) assert.ok(commands.docs(p.root, { name: topic }).length > 500, topic);
  assert.throws(() => commands.docs(p.root, { name: "datepicker" }), /Did you mean: date-picker/);

  const aliased = project("react", { "tsconfig.json": '{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }' });
  commands.init(aliased.root);
  assert.match(commands.docs(aliased.root, { name: "toggle" }), /import \{ Toggle \} from "@\/components\/ui\/toggle";/);
  const install = commands.docs(aliased.root, { name: "install" });
  assert.ok(install.includes("src/App.tsx") && !install.includes("App.vue"));
});

test("docs print two examples in full, the rest by id, and one alone when asked", () => {
  const p = project("react");
  commands.init(p.root);
  const count = (page) => page.split("## Examples")[1].match(/^```tsx/gm)?.length ?? 0;
  const some = commands.docs(p.root, { name: "toggle" });
  assert.equal(count(some), 2);
  assert.match(some, /More examples\. One of them as a complete file: `npx fndn docs toggle --example <id>`/);
  assert.ok(count(commands.docs(p.root, { name: "toggle", examples: "all" })) > 2);
  const none = commands.docs(p.root, { name: "toggle", examples: false });
  assert.equal(count(none), 0);
  assert.match(none, /- `[a-z-]+`: Watch a pull request/);
  /* one example, by the id the page lists, and nothing else */
  const id = /- `([a-z-]+)`: Watch a pull request/.exec(none)[1];
  const one = commands.docs(p.root, { name: "toggle", example: id });
  assert.match(one, /^### Watch a pull request/);
  assert.equal(one.match(/^```tsx/gm).length, 1);
  assert.ok(!one.includes("## Props"));
  assert.throws(() => commands.docs(p.root, { name: "toggle", example: "nope" }), /toggle has no example "nope"\. Its examples: /);
});

test("search answers a task in the user's words", () => {
  const p = project("react");
  const lines = (query) => commands.search(p.root, { query }).split("\n");
  assert.match(lines("pick a date")[0], /^date-picker/);
  const form = lines("settings form");
  assert.equal(form[0], "Which component for what:");
  assert.match(form[1], /field around input/);
  assert.ok(form.slice(0, 12).some((l) => l.startsWith("field ")));
  assert.match(lines("confirm delete").find((l) => /^[a-z]/.test(l)), /^alert-dialog/);
  /* nothing close: the whole catalogue, not a wrong guess */
  assert.match(commands.search(p.root, { query: "xyzzy" }), /Nothing matches[\s\S]*button-group/);
});

test("the MCP server answers both generations of the protocol", () => {
  const p = project("react");
  const call = (message) => respond(p.root, JSON.stringify({ jsonrpc: "2.0", ...message }));
  const modern = { _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28" } };

  const discover = call({ id: 1, method: "server/discover", params: modern }).result;
  assert.equal(discover.resultType, "complete");
  assert.ok(discover.supportedVersions.includes("2026-07-28"));
  assert.deepEqual(discover.capabilities, { tools: {} });

  const tools = call({ id: 2, method: "tools/list", params: modern }).result;
  assert.equal(tools.resultType, "complete");
  assert.deepEqual(tools.tools.map((t) => t.name), ["search", "docs", "add", "check", "status", "init"]);
  for (const t of tools.tools) assert.equal(t.inputSchema.type, "object", t.name);

  assert.equal(call({ id: 3, method: "tools/list", params: { _meta: { "io.modelcontextprotocol/protocolVersion": "1900-01-01" } } }).error.code, -32022);

  /* a problem the model can act on is a tool result; a malformed call is a protocol error */
  const notSetUp = call({ id: 4, method: "tools/call", params: { ...modern, name: "status", arguments: {} } }).result;
  assert.equal(notSetUp.isError, true);
  assert.match(notSetUp.content[0].text, /fndn init/);
  assert.equal(call({ id: 5, method: "tools/call", params: { ...modern, name: "nope" } }).error.code, -32602);
  assert.equal(call({ id: 6, method: "nope/nope", params: modern }).error.code, -32601);

  const init = call({ id: 7, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } } }).result;
  assert.equal(init.protocolVersion, "2025-06-18");
  assert.equal(init.serverInfo.name, "fndn");
  assert.equal(call({ method: "notifications/initialized" }), null);
  const legacy = call({ id: 8, method: "tools/call", params: { name: "init", arguments: {} } }).result;
  assert.equal(legacy.resultType, undefined);
  assert.equal(legacy.isError, false);
  assert.ok(fs.existsSync(path.join(p.root, "fndn.json")));
});
