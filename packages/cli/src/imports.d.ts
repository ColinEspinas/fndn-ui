// Types of imports.js.
export type AdapterFile = { file: string; source: string };
/** exported name → the component it belongs to */
export type ExportTable = Record<string, string>;
export declare function exportedNames(framework: string, file: string, source: string): string[];
export declare function indexLines(framework: string, files: AdapterFile[], from: (file: string) => string): string[];
export declare function exportTable(framework: string, components: Record<string, AdapterFile[]>): ExportTable;
export declare function toProjectImports(code: string, framework: string, table: ExportTable, base: string): string;
