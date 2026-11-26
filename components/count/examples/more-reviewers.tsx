import { Avatar, Count } from "@fndn/react";

const reviewers = [
  { name: "Maya Chen", color: "var(--fndn-tag-orange)" },
  { name: "Daniel Okafor", color: "var(--fndn-tag-blue)" },
];

/* the reviewers who do not fit are a count */
export default function MoreReviewers() {
  return (
    <div className="flex items-center gap-2 text-sm text-ink-2">
      Reviewers
      {reviewers.map((r) => (
        <Avatar key={r.name} name={r.name} color={r.color} size="20" />
      ))}
      <Count variant="boxed" size="sm" aria-label="3 more reviewers">+3</Count>
    </div>
  );
}
