import { Textarea } from "@fndn/react";

const payload = '{\n  "event": "deploy.failed",\n  "project": "billing-api",\n  "deploy": "dpl_7f3a9c",\n  "commit": "a1b2c3d"\n}';

/* autoResize off: a fixed height with a resize handle; mono for code */
export default function WebhookPayload() {
  return <Textarea autoResize={false} rows={6} mono aria-label="Test payload" className="w-full max-w-80" defaultValue={payload} />;
}
