// What a component's adapter files export, and how code imports them. Pure: the caller supplies
// the sources.
//
// The example files import components the way the adapter packages export them, from one root:
// `import { Card, CardFooter, type CardProps } from "@fndn/react"`. A project imports each component
// from its own folder, through the folder's index: `from "@/components/ui/card"`, in React, Vue
// and Svelte alike.

/* what a Vue SFC exports from its plain <script> block, or a Svelte component from <script module>
 * (toast(), a formatter) */
function valueExports(framework, source) {
  const blocks = [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter((m) => (framework === "vue" ? !/\bsetup\b/.test(m[1]) : /\bmodule\b/.test(m[1])));
  return [...new Set(blocks.flatMap((m) => [...m[2].matchAll(/^\s*export\s+(?:const|function|let|class)\s+([A-Za-z_]\w*)/gm)].map((x) => x[1])))];
}
const typeExports = (source) => [...new Set([...source.matchAll(/^\s*export\s+(?:type|interface)\s+([A-Za-z_]\w*)/gm)].map((m) => m[1]))];

/** Every name one adapter file exports. A Vue or Svelte component is its file's default export,
 * named after the file. */
export function exportedNames(framework, file, source) {
  if (framework === "react") {
    return [...new Set([
      ...[...source.matchAll(/^export\s+(?:declare\s+)?(?:function|const|let|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]),
      ...[...source.matchAll(/^export\s+(?:type\s+)?\{([^}]*)\}/gm)].flatMap((m) => m[1].split(",").map((n) => n.trim().split(/\s+as\s+/).pop()).filter(Boolean)),
    ])];
  }
  return [file.replace(/\.(vue|svelte)$/, ""), ...valueExports(framework, source), ...typeExports(source)];
}

/**
 * The lines of an index that exports a component's adapters: everything a React file exports; a
 * Vue or Svelte component by name, with the values and types its file exports.
 * `files`: [{ file, source }]; `from(file)` gives the import specifier of one.
 */
export function indexLines(framework, files, from) {
  if (framework === "react") return files.map(({ file }) => `export * from "${from(file).replace(/\.tsx?$/, "")}";`);
  return files.flatMap(({ file, source }) => {
    const types = typeExports(source);
    return [
      `export { ${["default as " + file.replace(/\.(vue|svelte)$/, ""), ...valueExports(framework, source)].join(", ")} } from "${from(file)}";`,
      ...(types.length ? [`export type { ${types.join(", ")} } from "${from(file)}";`] : []),
    ];
  });
}

/** Every exported name of a framework and the component it belongs to. `components`:
 * { <component>: [{ file, source }] }, the adapter files of that framework. */
export function exportTable(framework, components) {
  const table = {};
  for (const [component, files] of Object.entries(components)) for (const { file, source } of files) for (const name of exportedNames(framework, file, source)) table[name] = component;
  return table;
}

const ROOT_IMPORT = /^([ \t]*)import\s+(type\s+)?\{([^}]*)\}\s+from\s+["']@fndn\/(react|vue|svelte)["'];?[ \t]*$/gm;

/**
 * `code` with its `@fndn/<framework>` imports rewritten to the project's folders under `base`
 * ("@/components/ui", "$lib/components/ui", "./components/ui"): one line per component.
 * A line that names something the table does not know is left as it is.
 */
export function toProjectImports(code, framework, table, base) {
  return code.replace(ROOT_IMPORT, (line, indent, typeOnly, list, fw) => {
    if (fw !== framework) return line;
    const byComponent = new Map();
    for (const item of list.split(",").map((s) => s.trim()).filter(Boolean)) {
      const name = item.replace(/^type\s+/, "");
      const component = table[name.split(/\s+as\s+/)[0]];
      if (!component) return line;
      if (!byComponent.has(component)) byComponent.set(component, []);
      byComponent.get(component).push({ name, type: !!typeOnly || item.startsWith("type ") });
    }
    return [...byComponent].map(([component, items]) => {
      const allTypes = items.every((i) => i.type);
      const names = items.map((i) => (i.type && !allTypes ? `type ${i.name}` : i.name)).join(", ");
      return `${indent}import ${allTypes ? "type " : ""}{ ${names} } from "${base}/${component}";`;
    }).join("\n");
  });
}
