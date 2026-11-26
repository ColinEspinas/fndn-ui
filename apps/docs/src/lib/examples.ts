/* The docs' examples (components/<name>/examples/, plans/examples-format.md), on the server: each
 * component's index.json (order, titles, the playground's starting props) and the source of every
 * example file as the docs display it (imports as a project writes them after `fndn add`: one line per
 * component folder, packages/cli/src/imports.js). Server only; read through lib/content.ts. The
 * browser loads the example modules themselves (lib/mount-*.ts). */
import { toProjectImports } from "../../../../packages/cli/src/imports.js";
import { library } from "./catalog";
import { baseOf, componentOf, derive, exists, readJson, readText } from "./content";
import type { Example, Fw } from "./types";

export type ExampleRef = { file: string; title: string };
export type ExampleIndex = { playground: Omit<Example, "name">; examples: ExampleRef[] };

export const EXT: Record<Fw, string> = { react: "tsx", vue: "vue", svelte: "svelte" };
/** Where a project imports the components from (fndn.json's folder behind the framework's alias). */
export const IMPORT_BASE: Record<Fw, string> = { react: "@/components/ui", vue: "@/components/ui", svelte: "$lib/components/ui" };

const dirOfExamples = (name: string) => `components/${name}/examples`;

/** Every component's index.json, by component name. */
export const exampleIndex = (): Record<string, ExampleIndex> =>
  derive("example-index", ["components/*/examples/index.json"], (files) => Object.fromEntries(files.map((f) => [componentOf(f), readJson<ExampleIndex>(f)])));

/** One component's index.json (undefined when it has none). */
export const exampleIndexOf = (name: string): ExampleIndex | undefined => {
  const f = `${dirOfExamples(name)}/index.json`;
  return exists(f) ? readJson<ExampleIndex>(f) : undefined;
};

/** The raw example files of a component, by base name ("save-changes.tsx"). */
const filesOf = (name: string): Record<string, string> =>
  derive(`example-files:${name}`, [`${dirOfExamples(name)}/*.{tsx,vue,svelte}`], (files) => Object.fromEntries(files.map((f) => [baseOf(f), readText(f)])));

/** The example files of a component as displayed: { react: { "<file>": code }, vue, svelte };
 * a file that does not exist in a framework is left out. */
export function exampleSources(name: string): Record<Fw, Record<string, string>> {
  const out: Record<Fw, Record<string, string>> = { react: {}, vue: {}, svelte: {} };
  for (const [base, code] of Object.entries(filesOf(name))) {
    const dot = base.lastIndexOf(".");
    const fw = (Object.keys(EXT) as Fw[]).find((f) => EXT[f] === base.slice(dot + 1));
    if (fw) out[fw][base.slice(0, dot)] = toProjectImports(code, fw, library(fw).exports, IMPORT_BASE[fw]).replace(/\n$/, "");
  }
  return out;
}

/** The example files of a component in order, each marked when it plays steps (a `timeline` of
 * props): the page gives it a Replay of its own. */
export function exampleList(name: string): (ExampleRef & { steps?: true })[] {
  const files = filesOf(name);
  return (exampleIndexOf(name)?.examples ?? []).map((x) => {
    const steps = Object.entries(files).some(([base, code]) => base.replace(/\.[^.]+$/, "") === x.file && code.includes("const timeline"));
    return steps ? { ...x, steps: true as const } : x;
  });
}
