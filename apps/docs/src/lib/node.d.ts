/* The few Node APIs lib/content.ts uses (the workspace has no @types/node, and adding packages is
 * not this app's call). Server only. */
declare module "node:fs" {
  type Dirent = { name: string; isFile(): boolean; isDirectory(): boolean };
  const fs: {
    existsSync(path: string): boolean;
    statSync(path: string): { mtimeMs: number; size: number };
    readFileSync(path: string, encoding: "utf8"): string;
    readdirSync(path: string, options: { withFileTypes: true }): Dirent[];
  };
  namespace fs { export type { Dirent }; }
  export default fs;
}
declare module "node:path" {
  const path: { join(...parts: string[]): string; dirname(p: string): string };
  export default path;
}
declare const process: { cwd(): string };
