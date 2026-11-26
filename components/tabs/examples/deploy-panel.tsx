import { Tabs, type TabsItem } from "@fndn/react";

const build = [
  "10:42:01 Cloning github.com/northwind/web-app (main, a1b2c3d)",
  "10:42:03 Restored build cache from dpl_6e21b0",
  "10:42:05 Installing dependencies with pnpm 9.12",
  "10:42:19 Dependencies installed in 14s",
  "10:42:20 Running build: next build",
  "10:42:44 Compiled 312 files in 24s",
  "10:42:46 Uploading 4.1 MB to the edge network",
  "10:42:48 Build finished in 47s",
];
const runtime = [
  "10:51:03 POST /api/webhooks 200 in 84 ms",
  "10:51:09 GET /api/invoices?page=2 200 in 41 ms",
  "10:51:12 POST /api/webhooks 502 in 3,012 ms (retry 1 of 3)",
  "10:51:15 POST /api/webhooks 200 in 96 ms",
];

const log = (lines: string[]) => (
  <pre className="font-mono text-xs leading-5">{lines.map((line) => <div key={line}>{line}</div>)}</pre>
);

const items: TabsItem[] = [
  { value: "build", label: "Build", content: log(build) },
  { value: "runtime", label: "Runtime", content: log(runtime) },
];

/* fill: the tabs take the height of their pane and the log scrolls inside the panel */
export default function DeployPanel() {
  return (
    <div className="h-44 w-80">
      <Tabs fill variant="underline" items={items} defaultValue="build" aria-label="dpl_7f3a9c logs" />
    </div>
  );
}
