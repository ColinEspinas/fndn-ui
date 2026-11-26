// The rules `fndn check` applies to a project. They are the rules the library's own source is held
// to: the library's validator calls the same functions, so a project that passes is built to the
// standard of the components it uses.
//
// Everything here is pure (text in, findings out). check.js walks the files.

/** The variants in front of a utility (`hover:`, `[&>svg]:`, `data-[state=open]:`), up to its last top-level colon. */
function variantsOf(cls) {
  let depth = 0, cut = 0;
  for (let i = 0; i < cls.length; i++) {
    const c = cls[i];
    if (c === "[" || c === "(") depth++;
    else if (c === "]" || c === ")") depth--;
    else if (c === ":" && depth === 0) cut = i + 1;
  }
  return cls.slice(0, cut);
}

/** A utility without its variants (`hover:`, `[&>svg]:`, `data-[state=open]:`) and `!`. */
export function bareUtility(cls) {
  return cls.slice(variantsOf(cls).length).replace(/^!|!$/g, "");
}

const MOTION_WHAT = ["colors", "opacity", "shadow", "transform", "filter", "size", "radius"];
/* a time written out (`300ms`, `0.2s`); inside an arbitrary value `_` stands for a space */
const RAW_TIME = /(?<![a-zA-Z0-9.-])\d*\.?\d+m?s(?![a-zA-Z0-9-])/;
const withoutZero = (s) => s.replace(/(?<![\d.])0m?s/g, "");
const PALETTE = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const COLOR_UTILITY = "bg|text|border(?:-[xytrblse])?|ring|ring-offset|inset-ring|outline|fill|stroke|decoration|divide|from|via|to|shadow|inset-shadow|accent|caret|placeholder";
const PALETTE_COLOR = new RegExp(`^(?:${COLOR_UTILITY})-(?:(?:${PALETTE})-(?:50|[1-9]00|950)|white|black)(?:/.+)?$`);
const LITERAL_COLOR = /#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})(?![\w-])|(?<![\w-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;
/* black or white with an alpha (a highlight, a soft shadow) reads the same in both themes */
const NEUTRAL_OKLCH = /oklch\([\d.]+%?[_\s]+0[_\s]+0(?:[_\s]*\/[^)]*)?\)/gi;
const SIZES = "2xs|xs|sm|md|lg|xl|2xl|3xl|4xl";
const names = (list) => list.join(", ");

/* Direction. Layout is written in logical utilities, so the same markup reads right to left. These
 * physical sides are reported, with any variants in front and `-` or `!`, each with its logical
 * replacement:
 *   margin, padding        ml- mr- pl- pr-                  → ms- me- ps- pe-
 *   scroll margin, padding scroll-ml- scroll-mr- scroll-pl- scroll-pr- → scroll-ms- … scroll-pe-
 *   inset                  left- right-                     → start- end-
 *   border                 border-l border-r (width, colour) → border-s border-e
 *   radius                 rounded-l rounded-r rounded-tl rounded-tr rounded-bl rounded-br
 *                                                           → rounded-s rounded-e rounded-ss rounded-se rounded-es rounded-ee
 *   text, float, clear     text-left text-right float-* clear-* → -start -end
 *   arbitrary properties   [margin-left:…] [padding-right:…] [scroll-margin-left:…] [border-left…:…]
 *                          [border-top-left-radius:…] [text-align:left] [float:right] [clear:left]
 *                                                           → the logical property
 * Not reported:
 *   - a class written for one direction: under `ltr:` or `rtl:`, or an arbitrary variant that tests
 *     direction (`[&:dir(rtl)]:`, `[[dir=rtl]_&]:`);
 *   - `[left:…]` and `[right:…]`: the spelling of a position that is physical on purpose. Offsets an
 *     engine or a measurement hands over (a popup's page coordinates, an indicator's --left) are
 *     physical in both directions, and the box they place must be placed by `left`;
 *   - what has no side: mx- px- inset-x- translate-x- space-x- origin-* (a transform origin follows
 *     the box, and a mirrored icon may need it physical). */
const SIDE = { l: "s", r: "e" };
const CORNER = { l: "s", r: "e", tl: "ss", tr: "se", bl: "es", br: "ee" };
/* a step of the spacing scale (0 to 99, so an id such as "pr-482" is not read as padding), a
 * fraction, a keyword, or an arbitrary value */
const SPACE_VALUE = String.raw`(?:\d{1,2}(?:\.\d+)?|\d+\/\d+|px|full|auto|\[.+\]|\(.+\))`;
const PHYSICAL = [
  [new RegExp(`^(-?(?:scroll-)?[mp])([lr])(-${SPACE_VALUE})$`), (m) => `${m[1]}${SIDE[m[2]]}${m[3]}`],
  [new RegExp(`^(-?)(left|right)(-${SPACE_VALUE})$`), (m) => `${m[1]}${m[2] === "left" ? "start" : "end"}${m[3]}`],
  [/^border-([lr])((?:-.+)?)$/, (m) => `border-${SIDE[m[1]]}${m[2]}`],
  [/^rounded-(tl|tr|bl|br|l|r)((?:-.+)?)$/, (m) => `rounded-${CORNER[m[1]]}${m[2]}`],
  [/^(text|float|clear)-(left|right)$/, (m) => `${m[1]}-${m[2] === "left" ? "start" : "end"}`],
];
const side = (s) => (s === "left" ? "start" : "end");
const PHYSICAL_PROPERTY = [
  [/^\[(margin|padding|scroll-margin|scroll-padding|border)-(left|right)((?:-[a-z]+)?):/, (m) => `[${m[1]}-inline-${side(m[2])}${m[3]}:…]`],
  [/^\[border-(top|bottom)-(left|right)-radius:/, (m) => `[border-${m[1] === "top" ? "start" : "end"}-${side(m[2])}-radius:…]`],
  [/^\[(text-align|float|clear):(left|right)\]$/, (m) => `[${m[1]}:${side(m[2])}]`],
];
const FOR_ONE_DIRECTION = /(?:^|:)(?:ltr|rtl):|\[[^\]]*(?::dir\(|\bdir\s*[~|^$*]?=)/;

function direction(u, variants = "") {
  if (FOR_ONE_DIRECTION.test(variants)) return null;
  for (const [re, logical] of [...PHYSICAL, ...PHYSICAL_PROPERTY]) {
    const m = re.exec(u);
    if (m) return `a physical side, which stays put right to left: use ${logical(m)} (a side meant for one direction goes under ltr: or rtl:)`;
  }
  return null;
}

/**
 * The class rules, bound to the tokens of the system (spec/tokens.json).
 * `check(utility)` takes a bare utility and returns `{ rule, message }` or null.
 */
export function classRules(tokens) {
  const own = (group) => Object.keys(tokens[group] ?? {}).filter((k) => !k.startsWith("$"));
  const timings = own("$transitions"), durations = own("duration"), easings = own("easing");
  const radii = own("radius"), shadows = own("shadow"), layers = own("z");
  const lowestLayer = Math.min(...layers.map((k) => tokens.z[k].$value));
  const colorUtilities = "bg-surface, text-ink-2, border-line";

  /* Motion comes from the tokens: one vocabulary, so every hover, press and popup in an app has
   * the same timing, and reduced motion is handled once, in the token values. */
  function motion(u) {
    let m;
    if ((m = /^motion-(.+)$/.exec(u))) {
      if (m[1].startsWith("also-[")) return RAW_TIME.test(withoutZero(m[1])) ? "a raw duration: use var(--fndn-duration-*)" : null;
      const what = MOTION_WHAT.find((x) => m[1].startsWith(`${x}-`));
      return what && timings.includes(m[1].slice(what.length + 1)) ? null : `not a motion utility: motion-<${MOTION_WHAT.join("|")}>-<${timings.join("|")}>`;
    }
    if (/^transition(-|$)/.test(u)) return u === "transition-none" ? null : "Tailwind's transition utilities give one timing to everything: use motion-<what>-<timing> (motion-colors-fast, motion-transform-press)";
    if ((m = /^(duration|delay)-(.+)$/.exec(u))) return m[2] === "0" || durations.includes(m[2]) ? null : `a raw ${m[1]}: use ${m[1]}-<${durations.join("|")}>`;
    if ((m = /^ease-(.+)$/.exec(u))) return easings.includes(m[1]) ? null : `a raw easing: use ease-<${easings.join("|")}>`;
    if ((m = /^animate-(.+)$/.exec(u))) {
      if (["fade-up", "fade-in", "pop-in", "none"].includes(m[1])) return null;
      if (!m[1].startsWith("[")) return "Tailwind's own animations are not part of the system: use animate-fade-up, animate-fade-in or animate-pop-in (a spinner is the spinner component)";
      return /infinite/.test(m[1]) || !RAW_TIME.test(m[1]) ? null : "a raw duration in a one-shot animation: use var(--fndn-duration-*)";
    }
    if (/^\[(transition|animation)[\w-]*:/.test(u)) return RAW_TIME.test(withoutZero(u)) ? "a raw duration: use the motion utilities or var(--fndn-duration-*)" : null;
    return null;
  }

  /* A scale is feedback of a fixed size: the press and popup tokens. scale-x / scale-y are size
   * reveals and mirrors, and stay free. */
  function scale(u) {
    if (/^-?scale-/.test(u) && !/^-?scale-(press|press-sm|popup|100|x-100|y-100)$|^-?scale-[xy]-/.test(u)) return `${u}: use scale-press, scale-press-sm or scale-popup`;
    for (const m of u.matchAll(/(?<![\w-])scale\(((?:var\([^)]*\))|[^)]*)\)/g)) {
      if (!/^(1|-1|0\.5|var\(--fndn-motion-(press-scale|press-scale-sm|popup-scale)\))$/.test(m[1].trim())) return `scale(${m[1].trim()}): use the press or popup scale tokens`;
    }
    return null;
  }

  /* Colours come from the tokens, which carry a light and a dark value: a palette colour or a
   * literal one is right in one theme and wrong in the other. */
  function color(u) {
    if (PALETTE_COLOR.test(u)) return `a Tailwind palette colour: use a token (${colorUtilities}); it has a light and a dark value`;
    /* only inside an arbitrary value: `bg-[#fafafa]`, `[color:rgb(0_0_0)]` */
    const arbitrary = u.includes("[") ? u.slice(u.indexOf("[")) : "";
    if (LITERAL_COLOR.test(arbitrary.replace(NEUTRAL_OKLCH, ""))) return `a literal colour: use a token (${colorUtilities}) or var(--fndn-*)`;
    return null;
  }

  /* The layers that float (popups, dialogs, toasts, tooltips) are ordered by the z tokens. A
   * number at or above the lowest of them would cover a popup. */
  function layer(u) {
    const m = /^z-(?:(\d+)|\[(\d+)\])$/.exec(u);
    return m && Number(m[1] ?? m[2]) >= lowestLayer ? `z-index ${m[1] ?? m[2]} sits among the floating layers: use ${names(layers.map((k) => `z-${k}`))}, or a small number (z-1 to z-4) inside a component` : null;
  }

  function shape(u) {
    if (new RegExp(`^rounded(?:-(?:[trblse]|[trbl][rl]|[se][se]))?(?:-(?:${SIZES}))?$`).test(u) && u !== "rounded-none" && !/-none$/.test(u)) return `Tailwind's radius scale: use ${names(radii.map((k) => `rounded-${k}`))}`;
    if (new RegExp(`^(?:shadow|inset-shadow|drop-shadow)(?:-(?:${SIZES}|inner))?$`).test(u)) return `Tailwind's shadow scale: use ${names(shadows.map((k) => `shadow-${k}`))}`;
    return null;
  }

  const RULES = [["motion", motion], ["scale", scale], ["color", color], ["layer", layer], ["shape", shape], ["direction", direction]];
  return {
    /** Takes a class with its variants (`hover:ml-2`) or a bare utility. */
    check(cls) {
      const utility = bareUtility(cls), variants = variantsOf(cls);
      for (const [rule, test] of RULES) { const message = test(utility, variants); if (message) return { rule, message }; }
      return null;
    },
    motion,
    scale,
  };
}

/* ── source files ─────────────────────────────────────────────────────────────────────────── */

/** Utilities that are also plain words: reported only where the text around them is a class list. */
export const AMBIGUOUS = new Set(["transition", "rounded", "shadow"]);
const MOUNT_ANIMATION = /^animate-(fade-up|fade-in|pop-in)$/;
export const ALLOW = /fndn-check-ok/;

/** Comments blanked out (newlines kept, so line numbers hold): prose in a comment is not code. */
export function withoutComments(text) {
  const blank = (m) => m.replace(/[^\n]/g, " ");
  return text.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/<!--[\s\S]*?-->/g, blank).replace(/(^|[\s;{}()])\/\/[^\n]*/g, (m, lead) => lead + blank(m.slice(lead.length)));
}

/** A run of text between quotes is a class list when it reads like one: several tokens, at least
 * one shaped like a utility, none shaped like prose or code. */
function isClassList(tokens) {
  return tokens.length > 1 && tokens.some((t) => /[-:]/.test(t)) && tokens.every((t) => /^[!\-@*[a-z0-9]/.test(t) && !/[.,;=]$/.test(t));
}

/**
 * The class rules over the text of one source file (JSX, Vue, Svelte, TypeScript): every
 * whitespace-separated token between quotes is read as a class. `{ rule, line, message }`, and
 * `advice: true` on the findings only the author can judge.
 */
export function scanClasses(text, rules) {
  const findings = [];
  withoutComments(text).split("\n").forEach((line, i) => {
    for (const run of line.split(/["'`]/)) {
      const tokens = run.trim().split(/\s+/).filter(Boolean);
      const list = isClassList(tokens);
      for (const token of tokens) {
        const utility = bareUtility(token.replace(/[,;]+$/, ""));
        /* a piece of a template or of prose (`motion-${what}`, `motion-<what>-<timing>`) is not a class */
        if (!utility || /[<>${}]/.test(utility) || (AMBIGUOUS.has(utility) && !list)) continue;
        const found = rules.check(token.replace(/[,;]+$/, ""));
        if (found) findings.push({ ...found, line: i + 1, message: `"${token}": ${found.message}` });
        else if (MOUNT_ANIMATION.test(utility)) findings.push({ rule: "mount", advice: true, line: i + 1, message: `"${token}" plays whenever the element mounts, so it replays on every page load and navigation: keep it only on what your code adds while the user watches` });
      }
    }
  });
  return findings;
}

/** The line numbers a `fndn-check-ok: reason` comment allows: its own line and the next. */
export function allowedLines(text) {
  const allowed = new Set();
  text.split("\n").forEach((l, i) => { if (ALLOW.test(l)) { allowed.add(i + 1); allowed.add(i + 2); } });
  return allowed;
}

/* ── stylesheets ──────────────────────────────────────────────────────────────────────────── */

const HOVER_MEDIA = /^@media\b(?=[^{]*\(\s*hover\s*:\s*hover\s*\))(?=[^{]*\(\s*pointer\s*:\s*fine\s*\))/;
const LAYOUT_PROPS = /(?<![\w-])(width|height|min-width|max-width|min-height|max-height|top|left|right|bottom|inset(?:-[a-z-]+)?|margin(?:-[a-z-]+)?|padding(?:-[a-z-]+)?|gap|font-size|border-width|line-height)(?![\w-])/g;
const TIME = /(?<![\w.-])(\d*\.?\d+)(ms|s)(?![\w-])/g;
const MOTION_PROPS = new Set(["transition", "transition-duration", "transition-delay", "transition-timing-function", "transition-property", "animation", "animation-duration", "animation-delay", "animation-timing-function", "animation-name"]);
const ANIMATION_KEYWORDS = /^(none|infinite|both|forwards|backwards|normal|reverse|alternate|alternate-reverse|running|paused|linear|ease|ease-in|ease-out|ease-in-out|step-start|step-end|initial|inherit|unset)$/;

export function keyframeNames(css) {
  return new Set([...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]));
}

/**
 * Motion and interaction rules for hand-written CSS:
 *
 *   hover-gated       a :hover rule sits inside @media (hover: hover) and (pointer: fine); on a
 *                     touch screen an ungated hover sticks after the tap
 *   no-transition-all `transition: all` animates whatever changes next
 *   no-scale-zero     nothing appears from nothing: start from the popup scale
 *   no-ease-in        ease-in delays the moment the user is watching
 *   easing-token      `ease` (colour, opacity), `linear` (loops) or var(--fndn-easing-*)
 *   duration-token    durations and delays are var(--fndn-duration-*); a loop (`infinite`) may be literal
 *   gpu-only          no transition on a layout property (grid-template-rows is the sanctioned reveal)
 *   known-keyframes   an animation is a shared ui-* keyframe or one defined in the same file
 *
 * A `lint-motion-ok: reason` or `fndn-check-ok: reason` comment on the line, or the line above, allows it.
 * @returns {{rule: string, line: number, message: string}[]}
 */
export function lintMotion(css, { sharedKeyframes = new Set() } = {}) {
  const findings = [];
  const ok = new Set();
  css.split("\n").forEach((l, i) => { if (/lint-motion-ok|fndn-check-ok/.test(l)) { ok.add(i + 1); ok.add(i + 2); } });
  const src = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
  const known = new Set([...sharedKeyframes, ...keyframeNames(src)]);
  const add = (rule, line, message) => { if (!ok.has(line)) findings.push({ rule, line, message }); };

  const stack = [];
  let buf = "", bufLine = 0, line = 1;
  const decl = (text, at) => {
    const i = text.indexOf(":");
    if (i < 0 || !stack.length) return;
    const prop = text.slice(0, i).trim().toLowerCase();
    const value = text.slice(i + 1).trim();
    if (!prop || prop.startsWith("--")) return;
    if (/scale\(\s*0(?:\.0+)?\s*[,)]/.test(value) || /(?<![\w-])scale\s*:\s*0(?:\.0+)?\s*$/.test(`${prop}:${value}`)) add("no-scale-zero", at, `${prop}: ${value}: nothing appears from nothing; start from var(--fndn-motion-popup-scale)`);
    if (!MOTION_PROPS.has(prop)) return;
    const loop = /\binfinite\b/.test(value);
    if ((prop === "transition" || prop === "transition-property") && /(?<![\w-])all(?![\w-])/.test(value)) add("no-transition-all", at, `${prop}: ${value} animates whatever changes next; name the properties`);
    if (prop === "transition" || prop === "transition-property") {
      const bare = value.replace(/var\([^)]*\)/g, "").replace(/calc\([^)]*\)/g, "");
      for (const m of bare.matchAll(LAYOUT_PROPS)) add("gpu-only", at, `transitions ${m[1]} (layout); use transform or opacity`);
    }
    if (prop !== "transition-property" && prop !== "animation-name") {
      const noVars = value.replace(/var\(\s*--[\w-]+\s*\)/g, "VAR");
      if (/(?<![\w-])ease-in(?![\w-])/.test(noVars)) add("no-ease-in", at, `${prop}: ${value}: ease-in delays the start, the moment the user is watching; use var(--fndn-easing-out-strong)`);
      const weak = /(?<![\w-])(ease-out|ease-in-out)(?![\w-])/.exec(noVars);
      if (weak) add("easing-token", at, `built-in ${weak[1]} is too weak; use var(--fndn-easing-out-strong) or var(--fndn-easing-move)`);
      if (/cubic-bezier\(/.test(noVars)) add("easing-token", at, "a literal cubic-bezier; use a var(--fndn-easing-*) token");
      if (!loop) for (const m of noVars.matchAll(TIME)) { if (Number(m[1]) !== 0) add("duration-token", at, `literal ${m[0]} in ${prop}; use var(--fndn-duration-*)`); }
    }
    if (prop === "animation" || prop === "animation-name") {
      const used = value.split(",").map((part) => part.trim().split(/\s+/).find((t) => /^[a-zA-Z_][\w-]*$/.test(t) && !ANIMATION_KEYWORDS.test(t)));
      for (const n of used) if (n && !known.has(n)) add("known-keyframes", at, `animation "${n}" is not a shared ui-* keyframe nor defined in this file`);
    }
  };

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") {
      const prelude = buf.trim();
      stack.push({ prelude, line: bufLine || line });
      if (!prelude.startsWith("@") && /:hover\b/.test(prelude) && !stack.some((s) => HOVER_MEDIA.test(s.prelude))) {
        add("hover-gated", bufLine || line, `${prelude.replace(/\s+/g, " ").slice(0, 90)}: wrap in @media (hover: hover) and (pointer: fine)`);
      }
      buf = ""; bufLine = 0;
    } else if (ch === "}") {
      if (buf.trim()) decl(buf, bufLine || line);
      stack.pop(); buf = ""; bufLine = 0;
    } else if (ch === ";") {
      decl(buf, bufLine || line); buf = ""; bufLine = 0;
    } else {
      if (!bufLine && !/\s/.test(ch)) bufLine = line;
      buf += ch;
    }
    if (ch === "\n") line++;
  }
  return findings;
}

/* ── markup ───────────────────────────────────────────────────────────────────────────────── */

/**
 * The opening tags of the named elements in JSX, Vue or Svelte source: `{ name, text, line }`.
 * A `>` inside an attribute's braces or quotes (`onClick={() => a > b}`) does not end the tag.
 */
export function openingTags(source, tagNames) {
  const out = [];
  const re = new RegExp(`<(${tagNames.join("|")})(?=[\\s/>])`, "g");
  for (let m; (m = re.exec(source)); ) {
    let depth = 0, quote = "", i = re.lastIndex;
    for (; i < source.length; i++) {
      const c = source[i];
      if (quote) { if (c === quote) quote = ""; continue; }
      if (c === '"' || c === "'" || c === "`") quote = c;
      else if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0) break;
    }
    out.push({ name: m[1], text: source.slice(m.index, i + 1), line: source.slice(0, m.index).split("\n").length });
  }
  return out;
}

const NAMED_BY = /\b(aria-label|aria-labelledby|tooltip|label|title)\b|\{\s*\.\.\.|v-bind=/;

/** Icon-only controls need a name: a screen reader would announce only "button". */
export function unnamedIconControls(source) {
  return openingTags(source, ["Button", "Toggle"])
    .filter((t) => /\ssquare(?=[\s/>])|\ssquare=\{true\}|\s:square="true"/.test(t.text) && !NAMED_BY.test(t.text))
    .map((t) => ({ rule: "name", line: t.line, message: `an icon-only <${t.name} square> has no name: add aria-label${t.name === "Toggle" ? ", or tooltip (which also names it)" : ""}` }));
}
