import { Avatar, Button } from "@fndn/react";

const reviewers = [
  { name: "Priya Raman", initials: "PR", state: "Requested 2 h ago", color: "var(--fndn-tag-purple)" },
  { name: "Lucas Moreau", initials: "LM", state: "Requested yesterday", color: "var(--fndn-tag-cyan)" },
];

/* 28px avatars beside sm buttons: one row height, one centre line. The name is in the text
 * beside each avatar, so the avatar takes initials only and stays decorative */
export default function ReviewRequests() {
  return (
    <ul className="flex w-80 flex-col gap-2 text-sm" aria-label="Reviewers of #482 Add retry to webhook delivery">
      {reviewers.map((reviewer) => (
        <li key={reviewer.name} className="flex items-center gap-2.5">
          <Avatar initials={reviewer.initials} color={reviewer.color} size="28" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-ink">{reviewer.name}</span>
            <span className="truncate text-xs text-ink-2">{reviewer.state}</span>
          </span>
          <Button className="ms-auto" variant="outline" size="sm">Remind</Button>
        </li>
      ))}
    </ul>
  );
}
