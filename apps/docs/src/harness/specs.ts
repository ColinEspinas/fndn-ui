import type { Example, Spec } from "../lib/types";

/** What the test page mounts: a component's spec with its test fixtures. */
export type HarnessSpec = Pick<Spec, "name" | "props"> & { examples?: Example[]; worstCase?: Example[] };

const specs = import.meta.glob(["../../../../components/*/*.json", "!**/*.fixtures.json"], { import: "default" }) as Record<string, () => Promise<HarnessSpec>>;
const fixtures = import.meta.glob("../../../../components/*/*.fixtures.json", { import: "default" }) as Record<string, () => Promise<Pick<HarnessSpec, "examples" | "worstCase">>>;

/** A component's spec with its fixtures attached (examples, worstCase:
 * components/<name>/<name>.fixtures.json). The spec file itself is the contract only. */
export async function specOf(name: string | null): Promise<HarnessSpec | undefined> {
  const spec = await specs[`../../../../components/${name}/${name}.json`]?.();
  if (!spec) return undefined;
  return { ...spec, ...(await fixtures[`../../../../components/${name}/${name}.fixtures.json`]?.()) };
}
