import { Splitter } from "@fndn/react";

const code = [
  "test(\"retries a failed delivery\", async () => {",
  "  server.failNext(2);",
  "  await deliver(event);",
  "  expect(server.calls).toBe(3);",
  "});",
];
const output = ["$ pnpm test webhooks", "✓ webhooks.test.ts (12 tests) 840ms", "Tests  12 passed (12)"];

export default function EditorAndTerminal() {
  return (
    <div className="h-64 w-full max-w-md rounded-card bg-surface shadow-card">
      <Splitter
        orientation="vertical"
        grip
        defaultSize={[60, 40]}
        panels={[
          { id: "editor", minSize: 25, content: <pre className="p-3 font-mono text-xs leading-relaxed text-ink">{code.join("\n")}</pre> },
          { id: "terminal", minSize: 20, content: <pre className="p-3 font-mono text-xs leading-relaxed text-ink-2">{output.join("\n")}</pre> },
        ]}
      />
    </div>
  );
}
