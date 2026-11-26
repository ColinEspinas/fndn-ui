import type { ComponentProps } from "react";
import { PromptBar } from "@fndn/react";

type Props = ComponentProps<typeof PromptBar>;

const models: Props["models"] = [
  { value: "atlas-large", label: "Atlas Large", meta: "Most capable" },
  { value: "atlas-small", label: "Atlas Small", meta: "Fastest" },
];

const sources: Props["sources"] = [
  { value: "accounts", label: "Customer accounts", description: "1,284 workspaces, plans and MRR", icon: "users" },
];

const commands: Props["commands"] = [
  { value: "summarize", description: "Summarize this conversation" },
  { value: "draft-email", description: "Write an email to a customer" },
  { value: "query", description: "Ask the data warehouse in SQL" },
  { value: "chart", description: "Chart the last result" },
  { value: "ticket", description: "Open a support ticket" },
];

/* the composer sits at the foot of the chat; the list opens upward into the room above it */
export default function CommandListOpen() {
  return (
    <div className="flex h-[300px] w-[420px] max-w-full flex-col justify-end">
      <PromptBar
        shape="rounded"
        defaultValue="/"
        defaultModel="atlas-large"
        models={models}
        sources={sources}
        commands={commands}
      />
    </div>
  );
}
