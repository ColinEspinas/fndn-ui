import { TagsInput } from "@fndn/react";

/* each label keeps its colour; a new label gets one from its word (tone "auto") */
const tones = { bug: "red", billing: "purple", webhooks: "cyan" } as const;

export default function Labels() {
  return <TagsInput label="Labels" defaultValue={["bug", "billing", "webhooks"]} tone="auto" tones={tones} placeholder="Add a label" style={{ width: 320 }} />;
}
