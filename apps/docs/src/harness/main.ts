/* The test page (harness.html, served by the dev server: ./serve.mjs): what the browser tests
 * drive. It mounts one example of one component in one framework, from the address:
 * ?c=<name>&fw=react|vue|svelte&ex=<index>, and &theme=dark, &dir=rtl, &data=worst, &step=<n>,
 * &play=1. Nothing of the docs site is on it: its own stylesheet, the fonts, the stage. */
import { specOf } from "./specs";
import "./harness.css";
import "../styles/fonts.css";
import { setTheme } from "../../../../packages/core/src/theme";
import { mountExample } from "./mount";
import { finalSize, play, reserve, stepsOf } from "./scenario";
import type { Fw } from "../lib/types";

const params = new URLSearchParams(location.search);
const spec = await specOf(params.get("c"));
const stage = document.querySelector<HTMLElement>("#stage")!;
const theme = params.get("theme");
if (theme === "light" || theme === "dark") setTheme(theme);
if (params.get("dir") === "rtl") document.documentElement.dir = "rtl";

if (!spec) stage.textContent = `Unknown component "${params.get("c")}". Use ?c=<name>&fw=react|vue|svelte&ex=<index>`;
else {
  /* the real font metrics before anything is mounted or measured (fonts.css uses font-display: block) */
  await Promise.race([Promise.all([document.fonts.load("13px Inter"), document.fonts.load("13px 'JetBrains Mono'")]), new Promise((r) => setTimeout(r, 2000))]).catch(() => {});
  const data = params.get("data") === "worst" ? "worst" : "demo";
  const target = (params.get("fw") ?? "react") as Fw;
  const index = Number(params.get("ex") ?? 0);
  const total = data === "demo" ? stepsOf(spec.examples?.[index] ?? spec.examples?.[0]).length : 0;
  const root = document.documentElement;
  /* &step=<n>: the state after n steps, no timers. &play=1: the steps in real time. */
  const step = Math.min(Number(params.get("step") ?? 0) || 0, total);
  const playing = total > 0 && params.get("play") === "1";
  if (playing) reserve(stage, await finalSize(stage, (n) => mountExample(stage, spec, target, index, { data, step: n }), total));
  const mounted = await mountExample(stage, spec, target, index, { data, step });
  /* tests reach the mounted example to play the caller (e.g. remove a tab that asked to close) */
  (window as unknown as { __harnessMounted?: typeof mounted }).__harnessMounted = mounted;
  root.dataset.harnessStep = String(step);
  root.dataset.harnessSteps = String(total);
  root.dataset.harnessReady = "";
  if (playing) play(mounted, spec.examples![index] ?? spec.examples![0]!, { from: step, onStep: (n) => { root.dataset.harnessStep = String(n); if (n === total) root.dataset.harnessPlayed = ""; } });
}
