import { useState } from "react";
import { File } from "@phosphor-icons/react";
import { CodeBlock, Tabs } from "@fndn/react";

const files = [
  {
    path: "src/middleware/rate-limit.ts",
    name: "rate-limit.ts",
    lines: [
      "import { buckets } from \"./store\";",
      "",
      "const WINDOW_MS = 60_000;",
      "const LIMIT = 120;",
      "",
      "export function rateLimit(key: string, now = Date.now(), options: { limit?: number; windowMs?: number } = {}) {",
      "  const bucket = buckets.get(key) ?? { count: 0, windowStart: now };",
      "  if (now - bucket.windowStart >= (options.windowMs ?? WINDOW_MS)) {",
      "    bucket.count = 0;",
      "    bucket.windowStart = now;",
      "  }",
      "  bucket.count += 1;",
      "  buckets.set(key, bucket);",
      "  return bucket.count <= (options.limit ?? LIMIT);",
      "}",
    ],
  },
  { path: "package.json", name: "package.json", lines: ["{", "  \"name\": \"billing-api\",", "  \"version\": \"2.14.0\",", "  \"private\": true", "}"] },
];

/* an editor pane: attached file tabs over the code block's editor look (no frame, no header, no
 * copy; lines never wrap, the gutter stays while the code scrolls sideways) */
export default function EditorPane() {
  const [open, setOpen] = useState(files);
  const [active, setActive] = useState(files[0]!.path);
  return (
    <div className="h-64 w-full max-w-[560px] overflow-hidden rounded-card bg-canvas shadow-card">
      {open.length ? (
        <Tabs
          variant="attached"
          size="xs"
          closable
          fill
          aria-label="Open files"
          value={active}
          onValueChange={setActive}
          onClose={(path) => setOpen((tabs) => tabs.filter((file) => file.path !== path))}
          items={open.map((file) => ({
            value: file.path,
            label: file.name,
            icon: <File data-slot="icon" />,
            content: <CodeBlock editor filename={file.path} lines={file.lines} currentLine={file.path === active ? 7 : undefined} />,
          }))}
        />
      ) : (
        <p className="p-4 text-sm text-ink-2">No open files</p>
      )}
    </div>
  );
}
