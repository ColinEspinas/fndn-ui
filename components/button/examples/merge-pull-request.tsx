import { CheckCircle } from "@phosphor-icons/react";
import { Button } from "@fndn/react";

/* success: the green fill for the one action whose colour says "this is safe to go", once every
 * check has passed; the line above it says why */
export default function MergePullRequest() {
  return (
    <div className="flex max-w-96 flex-col items-start gap-3">
      <div>
        <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <CheckCircle data-slot="icon" weight="fill" className="shrink-0 text-green" aria-hidden />
          All checks have passed
        </p>
        <p className="text-sm text-ink-2">4 successful checks · Approved by Priya Raman. Merges #482 into main.</p>
      </div>
      <Button variant="success">Merge pull request</Button>
    </div>
  );
}
