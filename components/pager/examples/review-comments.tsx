import { useState } from "react";
import { Pager } from "@fndn/react";

const comments = [
  { author: "Priya Raman", file: "deliver.ts:42", text: "Should the backoff cap at 5 minutes? A dead endpoint retries for hours now." },
  { author: "Lucas Moreau", file: "retry-policy.ts:8", text: "Rename MAX to MAX_ATTEMPTS so it reads at the call site." },
  { author: "Priya Raman", file: "deliver.test.ts:117", text: "Add a case for a 410 Gone: we should stop at once." },
  { author: "Aiko Tanaka", file: "README.md:56", text: "Document the new retry headers for customers." },
];

export default function ReviewComments() {
  const [page, setPage] = useState(0);
  const comment = comments[page];
  return (
    <div className="flex w-80 flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-ink">Unresolved comments</span>
        <Pager
          count={comments.length}
          page={page}
          onPageChange={setPage}
          layout="start"
          unit="Comment"
          label="Unresolved comments"
          prevLabel="Previous comment"
          nextLabel="Next comment"
        />
      </div>
      {comment && (
        <div className="flex flex-col gap-0.5 text-sm">
          <span className="text-xs text-ink-2">{comment.author} on <span className="font-mono">{comment.file}</span></span>
          <p className="m-0 text-ink-2">{comment.text}</p>
        </div>
      )}
    </div>
  );
}
