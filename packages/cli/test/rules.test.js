// The rules, on small inputs: what must be reported, and what must not.
import test from "node:test";
import assert from "node:assert/strict";
import { bareUtility, classRules, lintMotion, scanClasses, unnamedIconControls } from "../src/rules.js";
import { catalog } from "../src/catalog.js";

const rules = classRules(catalog().tokens);
const rule = (utility) => rules.check(utility)?.rule ?? null;
const scan = (text) => scanClasses(text, rules).map((f) => `${f.line}:${f.rule}${f.advice ? "?" : ""}`);

test("a utility is read without its variants", () => {
  assert.equal(bareUtility("hover:bg-surface"), "bg-surface");
  assert.equal(bareUtility("[&>[data-slot=icon]]:size-[1em]"), "size-[1em]");
  assert.equal(bareUtility("[:root:not([data-fndn-input=keyboard])_&:active]:scale-press"), "scale-press");
  assert.equal(bareUtility("data-[state=open]:!opacity-100"), "opacity-100");
});

test("the system's own utilities pass", () => {
  for (const u of ["bg-surface", "text-ink-2", "border-line", "bg-red", "text-green", "bg-red-tint", "rounded-control", "rounded-full", "rounded-none", "rounded-t-none", "rounded-[3px]",
    "shadow-card", "shadow-none", "shadow-[inset_0_1px_0_oklch(1_0_0/0.14)]", "motion-colors-fast", "motion-transform-press", "motion-also-[clip-path_var(--fndn-duration-base)_ease]",
    "duration-fast", "duration-0", "delay-stagger", "ease-out-strong", "scale-press", "scale-popup", "scale-100", "scale-x-0", "animate-fade-up", "animate-none",
    "animate-[fndn-spin_0.8s_linear_infinite]", "transition-none", "z-1", "z-4", "-z-1", "z-popup", "z-dialog", "text-lg", "size-8", "p-4"]) {
    assert.equal(rule(u), null, u);
  }
});

test("what is not a token is reported, under its rule", () => {
  const cases = {
    color: ["bg-gray-100", "text-white", "border-zinc-200/50", "ring-blue-500", "bg-[#fafafa]", "text-[rgb(0_0_0)]", "[color:hsl(0_0%_0%)]", "bg-[oklch(0.7_0.2_30)]"],
    motion: ["transition", "transition-all", "transition-colors", "duration-300", "delay-150", "ease-in", "ease-in-out", "ease-[cubic-bezier(0.4,0,0.2,1)]", "animate-spin", "animate-pulse", "motion-colors", "motion-colors-quick", "animate-[fade_300ms_ease]", "[transition:opacity_0.2s]"],
    scale: ["scale-95", "scale-0", "scale-105", "[transform:scale(0.9)]"],
    layer: ["z-50", "z-[100]", "z-9999"],
    shape: ["rounded", "rounded-lg", "rounded-t-md", "shadow", "shadow-md", "shadow-xl", "drop-shadow-lg"],
  };
  for (const [expected, utilities] of Object.entries(cases)) for (const u of utilities) assert.equal(rule(u), expected, u);
});

test("a physical side is reported with its logical replacement", () => {
  const suggests = (cls) => /use (\S+)/.exec(rules.check(cls)?.message ?? "")?.[1] ?? null;
  const cases = {
    "ml-2": "ms-2", "mr-auto": "me-auto", "pl-4": "ps-4", "pr-[3px]": "pe-[3px]", "-ml-px": "-ms-px", "pl-(--x)": "ps-(--x)",
    "hover:ml-2": "ms-2", "data-[state=open]:pl-3": "ps-3", "!pr-2": "pe-2", "pr-2!": "pe-2", "[&>svg]:-mr-0.5": "-me-0.5",
    "scroll-ml-4": "scroll-ms-4", "scroll-pr-2": "scroll-pe-2",
    "left-0": "start-0", "right-1/2": "end-1/2", "-left-2": "-start-2", "after:right-[28%]": "end-[28%]",
    "border-l": "border-s", "border-r-2": "border-e-2", "border-l-line": "border-s-line",
    "rounded-l-control": "rounded-s-control", "rounded-tr-card": "rounded-se-card", "rounded-bl-none": "rounded-es-none", "rounded-br-full": "rounded-ee-full",
    "text-left": "text-start", "text-right": "text-end", "float-left": "float-start", "clear-right": "clear-end",
    "[margin-left:4px]": "[margin-inline-start:…]", "[border-right-color:red]": "[border-inline-end-color:…]",
    "[border-top-left-radius:4px]": "[border-start-start-radius:…]", "[text-align:right]": "[text-align:end]",
  };
  for (const [cls, logical] of Object.entries(cases)) {
    assert.equal(rules.check(cls)?.rule, "direction", cls);
    assert.equal(suggests(cls), logical, cls);
  }
});

test("a side written for one direction, a deliberate position or no side is not reported", () => {
  for (const cls of ["rtl:ml-2", "ltr:text-right", "hover:rtl:pl-3", "[&:dir(rtl)]:left-0", "[[dir=rtl]_&]:pr-2", "rtl:rounded-l-control",
    "[left:0]!", "[right:var(--x)]", "[text-align:match-parent]",
    "ms-2", "pe-4", "start-0", "end-2", "border-s", "rounded-ss-card", "text-start", "mx-2", "px-4", "inset-x-0", "translate-x-1", "-translate-x-full",
    "origin-top-right", "origin-left", "space-x-2", "border-line", "border-red", "rounded-pill", "text-lg"]) {
    assert.equal(rule(cls), null, cls);
  }
  /* placements and ids that look like a side are not classes */
  assert.deepEqual(scan('<Popover placement="left-start" /> <Tab value="pr-482" />'), []);
  assert.deepEqual(scan('<div className="flex ml-2 rtl:mr-2" />'), ["1:direction"]);
});

test("classes are found in source, prose is not", () => {
  assert.deepEqual(scan('<div className="flex gap-2 bg-gray-100 hover:shadow-md" />'), ["1:color", "1:shape"]);
  assert.deepEqual(scan('const cls = cond ? "duration-300" : "duration-fast";'), ["1:motion"]);
  /* words that are also utilities count only inside a class list */
  assert.deepEqual(scan('const title = "A smooth transition between pages";'), []);
  assert.deepEqual(scan('<p>The card has a soft shadow and rounded corners</p>'), []);
  assert.deepEqual(scan('<div class="rounded shadow p-4" />'), ["1:shape", "1:shape"]);
  /* comments, template pieces and placeholders are not classes */
  assert.deepEqual(scan("// use transition-all here\n/* bg-gray-100 */\n<!-- duration-300 -->"), []);
  assert.deepEqual(scan("`motion-${what}-${timing}` and \"motion-<what>-<timing>\""), []);
  assert.deepEqual(scan('const text = "Fixed a crash (#482).";'), []);
  /* an entrance in app code is advice, not an error */
  assert.deepEqual(scan('<li className="animate-fade-up" />'), ["1:mount?"]);
});

test("an icon-only control needs a name", () => {
  const found = (source) => unnamedIconControls(source).length;
  assert.equal(found("<Button square icon={<X />} onClick={() => a > b} />"), 1);
  assert.equal(found('<Button square aria-label="Close" icon={<X />} />'), 0);
  assert.equal(found('<Toggle square tooltip="Pin" />'), 0);
  assert.equal(found("<Button square {...props} />"), 0);
  assert.equal(found("<Button variant=\"primary\">Save</Button>"), 0);
  assert.equal(found('<Button\n  square\n  onClick={() => { if (a > b) go(); }}\n/>'), 1);
});

test("hand-written CSS", () => {
  const found = (css) => lintMotion(css).map((f) => f.rule);
  assert.deepEqual(found(".a:hover { color: red; }"), ["hover-gated"]);
  assert.deepEqual(found("@media (hover: hover) and (pointer: fine) { .a:hover { color: red; } }"), []);
  assert.deepEqual(found(".a { transition: all 0.3s ease-in; }"), ["no-transition-all", "no-ease-in", "duration-token"]);
  assert.deepEqual(found(".a { transition: opacity var(--fndn-duration-fast) ease; }"), []);
  assert.deepEqual(found(".a { transition: height var(--fndn-duration-base) ease; }"), ["gpu-only"]);
  assert.deepEqual(found(".a { animation: spin 1s linear infinite; } @keyframes spin { to { rotate: 1turn; } }"), []);
  assert.deepEqual(found("/* fndn-check-ok: a third-party widget */\n.a:hover { color: red; }"), []);
});
