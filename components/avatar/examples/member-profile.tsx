import { Avatar } from "@fndn/react";

/* 40px in a profile header: the name beside it at the header's size */
export default function MemberProfile() {
  return (
    <div className="flex w-80 items-center gap-3">
      <Avatar initials="DO" color="var(--fndn-tag-blue)" size="40" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-md font-medium text-ink">Daniel Okafor</span>
        <span className="truncate text-sm text-ink-2" dir="ltr">daniel@northwind.example · Admin</span>
      </div>
    </div>
  );
}
