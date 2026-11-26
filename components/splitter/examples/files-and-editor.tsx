import { Splitter } from "@fndn/react";

const files = ["deliver.ts", "retry.ts", "verify.ts", "webhooks.test.ts"];
const code = [
  "retry(() => post(event), {",
  "  attempts: 5,",
  "  backoff: \"exponential\",",
  "});",
];

export default function FilesAndEditor() {
  return (
    <div className="h-[136px] w-full">
      <Splitter
        defaultSize={[30, 70]}
        panels={[
          {
            id: "files",
            minSize: 25,
            content: (
              <ul className="flex flex-col gap-0.5 p-1.5 text-sm text-ink-2" aria-label="Files">
                {files.map((file) => (
                  <li key={file} className={`truncate rounded-control px-2 py-1 ${file === "deliver.ts" ? "bg-hover text-ink" : ""}`}>{file}</li>
                ))}
              </ul>
            ),
          },
          {
            id: "editor",
            minSize: 40,
            content: <pre className="p-3 font-mono text-xs leading-relaxed text-ink">{code.join("\n")}</pre>,
          },
        ]}
      />
    </div>
  );
}
