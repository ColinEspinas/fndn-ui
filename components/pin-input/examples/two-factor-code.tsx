import { PinInput } from "@fndn/react";

/* otp: the browser and the phone offer the code from the latest text message */
export default function TwoFactorCode() {
  return <PinInput label="Authentication code" otp />;
}
