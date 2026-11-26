import { Sparkle } from "@phosphor-icons/react";
import { Alert } from "@fndn/react";

export default function NewFeature() {
  return (
    <Alert className="w-full max-w-[420px]" tone="accent" icon={<Sparkle data-slot="icon" weight="bold" />} title="New: usage alerts">
      Get an email when a project reaches 80% of its build minutes.
    </Alert>
  );
}
