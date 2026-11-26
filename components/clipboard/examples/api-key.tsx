import { Clipboard } from "@fndn/react";

/* field: the value stays readable and selectable; the button copies it */
export default function ApiKey() {
  return <Clipboard variant="field" label="Live API key" value="nw_live_4fK9qL2mX8vR7tB3" className="w-80" />;
}
