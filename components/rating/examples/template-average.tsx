import { Rating } from "@fndn/react";

/* read-only and small: an average shown in a list row, still announced as a score */
const templates = [
  { name: "Status page", score: 4.5, ratings: "1,284" },
  { name: "Internal docs site with search", score: 4, ratings: "312" },
];

export default function TemplateAverage() {
  return (
    <ul className="flex w-80 flex-col gap-3">
      {templates.map((t) => (
        <li key={t.name} className="flex flex-col gap-1">
          <span className="text-sm text-ink">{t.name}</span>
          <span className="flex items-center gap-2 text-xs text-ink-2">
            <Rating aria-label={`Average rating of ${t.name}`} size="sm" allowHalf readOnly value={t.score} />
            {t.score.toFixed(1)} · {t.ratings} ratings
          </span>
        </li>
      ))}
    </ul>
  );
}
