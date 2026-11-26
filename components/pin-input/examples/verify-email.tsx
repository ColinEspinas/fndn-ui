import { useState } from "react";
import { PinInput } from "@fndn/react";

/* checked when the last digit is in; the message under it is a live region */
export default function VerifyEmail() {
  const [status, setStatus] = useState<"idle" | "wrong" | "ok">("idle");
  return (
    <div className="flex flex-col gap-2">
      <PinInput
        label="Verification code"
        otp
        invalid={status === "wrong"}
        onValueChange={() => setStatus("idle")}
        onValueComplete={(code) => setStatus(code === "123456" ? "ok" : "wrong")}
      />
      <p className="m-0 text-xs text-ink-2" role="status">
        {status === "wrong" ? "That code is wrong or has expired." : status === "ok" ? "Email verified." : "Sent to maya@northwind.example."}
      </p>
    </div>
  );
}
