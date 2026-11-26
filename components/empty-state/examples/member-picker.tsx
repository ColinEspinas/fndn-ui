import { Card, EmptyState } from "@fndn/react";

/* a member picker's list after typing "jonas.w": one row, at the list's row height */
export default function MemberPicker() {
  return (
    <Card elevation="overlay" className="w-80 max-w-full p-1">
      <EmptyState title="No members match “jonas.w”" hint="Invite by email instead" />
    </Card>
  );
}
