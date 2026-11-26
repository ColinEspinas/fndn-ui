import { InsightCards } from "@fndn/react";

export default function Empty() {
  return (
    <InsightCards
      title="This week"
      insights={[]}
      emptyText="No insights yet. They appear after your first full week of bookings."
      style={{ width: 344 }}
    />
  );
}
