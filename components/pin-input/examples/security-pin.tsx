import { PinInput } from "@fndn/react";

/* mask: dots instead of digits, for a PIN someone could read over a shoulder */
export default function SecurityPin() {
  return <PinInput label="PIN to reveal production secrets" length={4} mask />;
}
