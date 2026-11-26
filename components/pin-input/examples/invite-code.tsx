import { PinInput } from "@fndn/react";

/* alphanumeric: letters and digits, as printed on the invite */
export default function InviteCode() {
  return <PinInput label="Invite code" type="alphanumeric" length={6} defaultValue={["N", "W", "7"]} />;
}
