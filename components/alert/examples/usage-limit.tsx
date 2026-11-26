import { Alert } from "@fndn/react";

export default function UsageLimit() {
  return (
    <Alert className="w-full max-w-[420px]" tone="orange" title="web-app has used 92% of its build minutes">
      Builds pause at 100%. The limit resets on Dec 1.
    </Alert>
  );
}
