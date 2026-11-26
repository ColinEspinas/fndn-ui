/* The showcase (showcases/<app>/): whole app screens built only from the system, on the
 * server. Each app has an index.json ({ title, description, order?, shape? }) and an App.tsx whose
 * default export is the app (`shape`: what the app's own page would put in <html data-shape>); the other files of the folder are its parts. Server only (read through
 * lib/content.ts): the page loads the app itself through components/ShowcaseFrame.tsx. */
import { baseOf, derive, dirOf, readJson, readText } from "./content";

export type Showcase = { name: string; title: string; description: string; order?: number; shape?: "rounded" };
export type ShowcaseFile = { file: string; code: string };

/** Every app, in `order`, then by title. */
export const showcases = (): Showcase[] => derive("showcases", ["showcases/*/index.json"], (files) => files
  .map((f) => ({ ...readJson<Omit<Showcase, "name">>(f), name: dirOf(f) }))
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.title.localeCompare(b.title)));

export const showcaseOf = (name: string) => showcases().find((s) => s.name === name);

/** The app's source files: App.tsx first, then the rest by name. */
export function showcaseFiles(name: string): ShowcaseFile[] {
  return derive(`showcase-files:${name}`, [`showcases/${name}/*.{ts,tsx}`], (files) => files
    .map((f) => ({ file: baseOf(f), code: readText(f).replace(/\n$/, "") }))
    .sort((a, b) => (a.file === "App.tsx" ? -1 : b.file === "App.tsx" ? 1 : a.file.localeCompare(b.file))));
}
