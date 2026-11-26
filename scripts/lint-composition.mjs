// Composition lint for the recipes (components/<name>/<name>.recipe.ts and the shared ones in
// components/lib/): the "Choosing among options"
// rules in docs/design/interaction.md and the shared atoms that must exist once. It reads the
// classes of every slot, variant and compound variant, with the slot each one lands on.
//
//   press-equals-hover   a press background (`active:bg-…`) equal to the same slot's hover
//                        background in the same look, or the glide colour (`bg-hover`): the press
//                        cannot be seen
//   hover-outranks-press a slot with an `active:bg-…` whose hover background is written as an
//                        arbitrary selector (`[&:hover]:bg-…`, not inside `:where()`): it can
//                        out-rank the press. (Tailwind's own `hover:` sorts before `active:` at the same
//                        specificity, so plain `hover:` never does.)
//   scale-token          a scale other than the tokens: `scale-press`, `scale-press-sm`,
//                        `scale-popup`, `scale-100` (rest), `scale(1)`, `scale(-1)`, `scale(0.5)`
//                        (a mark popping in), `scale(var(--fndn-motion-…))`; scaleX / scaleY and
//                        `scale-x-*` / `scale-y-*` are size reveals and mirrors, not checked
//   easing-move-scope    the move easing (`motion-*-glide`, `ease-move`, `ease-in-out-strong`,
//                        `--fndn-easing-move`, `--fndn-easing-in-out-strong`) outside a thumb,
//                        indicator or reel slot
//   shared-copy          a copy of a shared atom outside its home recipe: shimmer text
//                        (`fndn-shimmer-text` → shimmer, progress), visually hidden by hand
//                        (`clip-path:inset(50%)` → Tailwind's `sr-only`). A recipe that plays a
//                        shared keyframe (`animate-[fndn-spin…]`) uses the atom, it does not copy it;
//                        a keyframe redefined in base.css is the motion lint's (validate.mjs)
//
// Escape hatch: `fndn-check-ok` in a comment on the class's line or the line above, in the
// recipe's source.
// CLI: node scripts/lint-composition.mjs [recipe names…]   (prints each finding; exit code 1 if any)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, SHARED_RECIPES, componentNames, loadRecipe, recipePath, bareUtility } from "./lib.mjs";

export const CHECKS = ["press-equals-hover", "hover-outranks-press", "scale-token", "easing-move-scope", "shared-copy"];

/** [slot, class, origin] for every class of a recipe (base is "base"; a bare string in a slotted
 * recipe's variant lands on base). origin is "" for the slot's own classes, else the variant value
 * or compound variant the class comes from (two looks of one slot never apply together). */
export function slotClasses(recipe) {
  const out = [];
  const add = (slot, v, origin = "") => {
    if (typeof v === "string") v.split(/\s+/).filter(Boolean).forEach((c) => out.push([slot, c, origin]));
    else if (Array.isArray(v)) v.forEach((x) => add(slot, x, origin));
  };
  const addSlotted = (v, origin) => {
    if (typeof v === "string" || Array.isArray(v)) add("base", v, origin);
    else if (v && typeof v === "object") for (const [slot, x] of Object.entries(v)) add(slot, x, origin);
  };
  add("base", recipe.base);
  for (const [slot, v] of Object.entries(recipe.slots ?? {})) add(slot, v);
  for (const [key, values] of Object.entries(recipe.variants ?? {})) for (const [val, v] of Object.entries(values ?? {})) addSlotted(v, `${key}=${val}`);
  (recipe.compoundVariants ?? []).forEach((cv, i) => addSlotted(cv.class ?? cv.className, `compound ${i}`));
  (recipe.compoundSlots ?? []).forEach((cs, i) => { for (const slot of cs.slots ?? []) add(slot, cs.class ?? cs.className, `compound slots ${i}`); });
  return out;
}

/** The variant chain of a class (everything before the utility). */
const variantsOf = (cls) => cls.slice(0, cls.length - bareUtility(cls).length);
const MOVE_SLOT = /^(thumb|indicator|reel)$|(Thumb|Indicator|Reel)$/;
const SCALE_OK = /^-?scale-(press|press-sm|popup|100|x-100|y-100)$|^-?scale-[xy]-/;
const SHARED = [
  { re: /fndn-shimmer-text\b/, home: ["shimmer", "progress"], what: "shimmer loop copy; use the shimmer recipe" },
  { re: /clip-path:inset\(50%\)/, home: [], what: "visually hidden by hand; use sr-only" },
];

/** Findings for one recipe: { check, slot, cls, message }. */
export function lintRecipe(name, recipe) {
  const found = [];
  const add = (check, slot, cls, message) => found.push({ check, slot, cls, message });
  const pairs = slotClasses(recipe);
  /* an unconditioned press and hover (a press gated to the pointer counts as unconditioned) */
  const isPress = (v) => v === "active:" || /^\[:root:not\(\[data-fndn-input=keyboard\]\)_&:active\]:$/.test(v);
  const isHover = (v) => v === "hover:";
  /* a hover written as an arbitrary selector, outside :where() (zero specificity) and outside a media query */
  const rawHover = (v) => { const sel = v.replace(/\[@media[^\]]*\]:/g, ""); return /\[[^\]]*:hover/.test(sel) && !/:where\(/.test(sel); };
  const slots = new Map();
  for (const [slot, cls, origin] of pairs) {
    const g = slots.get(slot) ?? slots.set(slot, new Map()).get(slot);
    (g.get(origin) ?? g.set(origin, []).get(origin)).push(cls);
  }
  for (const [slot, groups] of slots) {
    const own = groups.get("") ?? [];
    for (const [origin, list] of groups) {
      const scope = origin ? [...own, ...list] : own;
      const hover = new Set(scope.filter((c) => isHover(variantsOf(c)) && /^bg-/.test(bareUtility(c))).map(bareUtility));
      const press = list.filter((c) => isPress(variantsOf(c)) && /^bg-/.test(bareUtility(c)));
      for (const cls of press) {
        const u = bareUtility(cls);
        if (u === "bg-hover") add("press-equals-hover", slot, cls, `presses with bg-hover, the hover and glide colour; press with bg-hover-2`);
        else if (hover.has(u)) add("press-equals-hover", slot, cls, `presses with ${u}, the same as its hover${origin ? ` (${origin})` : ""}`);
      }
      if (press.length) for (const cls of scope) if (/^bg-/.test(bareUtility(cls)) && rawHover(variantsOf(cls))) add("hover-outranks-press", slot, cls, `a hover background in an arbitrary selector can out-rank ${press[0]}`);
    }
  }

  for (const [slot, cls] of pairs) {
    const u = bareUtility(cls);
    if (/^-?scale-/.test(u) && !SCALE_OK.test(u)) add("scale-token", slot, cls, `${u}: use scale-press, scale-press-sm or scale-popup`);
    /* scale(): the tokens, rest, a mirror, or 0.5 (a mark that pops in); scaleX / scaleY are size reveals */
    for (const m of cls.matchAll(/(?<![\w-])scale\(((?:var\([^)]*\))|[^)]*)\)/g)) {
      const val = m[1].trim();
      if (!/^(1|-1|0\.5|var\(--fndn-motion-(press-scale|press-scale-sm|popup-scale)\))$/.test(val)) add("scale-token", slot, cls, `scale(${val}): use the press or popup scale tokens`);
    }
    if (/^motion-[a-z]+-glide$|^ease-(move|in-out-strong)$|--fndn-easing-(move|in-out-strong)\b/.test(u) || /--fndn-easing-(move|in-out-strong)\b/.test(cls)) {
      if (!MOVE_SLOT.test(slot)) add("easing-move-scope", slot, cls, `the move easing on "${slot}"; it is for thumbs, indicators and reels: use out-strong`);
    }
    for (const s of SHARED) if (s.re.test(cls) && !s.home.includes(name)) add("shared-copy", slot, cls, s.what);
  }
  return found;
}

/** Drops findings whose class sits on (or under) a line marked fndn-check-ok. */
function honourEscapes(name, found) {
  if (!found.length) return found;
  const lines = fs.readFileSync(path.join(ROOT, recipePath(name)), "utf8").split("\n");
  return found.filter((f) => {
    const at = lines.findIndex((l) => l.includes(f.cls));
    return at < 0 || !(/fndn-check-ok/.test(lines[at]) || /fndn-check-ok/.test(lines[at - 1] ?? ""));
  });
}

/** Lints the recipes (all, or the named ones); prints a one-line summary and returns the findings
 * with their file. */
export async function reportComposition(names = []) {
  const all = [];
  const files = [...componentNames(), ...SHARED_RECIPES];
  for (const name of files.filter((n) => !names.length || names.includes(n)).sort()) {
    let recipe;
    try { recipe = await loadRecipe(name); } catch { continue; /* validate reports a recipe that does not load */ }
    if (!recipe) continue;
    for (const x of honourEscapes(name, lintRecipe(name, recipe))) all.push({ ...x, file: recipePath(name) });
  }
  const counts = CHECKS.map((c) => `${c} ${all.filter((x) => x.check === c).length}`).join(", ");
  console.log(`composition lint: ${all.length} — ${counts}`);
  return all;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const found = await reportComposition(process.argv.slice(2));
  for (const x of found) console.error(`error [composition] ${x.file} ${x.slot}: ${x.check}: ${x.message} ("${x.cls}")`);
  process.exit(found.length ? 1 : 0);
}
