import { Editable } from "@fndn/react";

const description = "Webhook deliveries that time out are dropped today.\nRetry them three times with backoff, then mark the event failed.";

/* a description reads as plain text; the field appears only while editing. Enter starts a new line,
 * Cmd/Ctrl+Enter or a click away saves */
export default function IssueDescription() {
  return <Editable aria-label="Description" multiline size="sm" defaultValue={description} placeholder="Add a description…" style={{ width: 360 }} />;
}
