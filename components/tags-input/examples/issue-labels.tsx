import { TagsInput } from "@fndn/react";

/* an issue's labels in the outline look: neutral tags, the colour only in the dot, as the issue list shows them */
const tones = { bug: "red", regression: "orange", billing: "purple", webhooks: "cyan" } as const;

export default function IssueLabels() {
  return <TagsInput label="Labels" defaultValue={["bug", "regression", "billing"]} tagVariant="outline" tone="auto" tones={tones} placeholder="Add a label" style={{ width: 320 }} />;
}
