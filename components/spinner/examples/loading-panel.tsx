import { Spinner } from "@fndn/react";

export default function LoadingPanel() {
  return (
    <div role="status" className="flex h-32 w-80 max-w-full flex-col items-center justify-center gap-3 text-sm text-ink-2">
      <Spinner size="lg" decorative />
      Loading build logs for dpl_7f3a9c…
    </div>
  );
}
