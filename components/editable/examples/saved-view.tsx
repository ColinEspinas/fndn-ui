import { Editable } from "@fndn/react";

/* sm: a saved view's name in a sidebar, renamed where it is */
export default function SavedView() {
  return <Editable size="sm" aria-label="View name" defaultValue="Failed deploys this week" style={{ width: 220 }} />;
}
