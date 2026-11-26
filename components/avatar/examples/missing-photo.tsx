import { Avatar } from "@fndn/react";

/* the photo failed to load: the initials under it show instead */
export default function MissingPhoto() {
  return (
    <div className="flex w-80 gap-2.5 text-sm">
      <Avatar name="Sofia Alvarez" src="/avatars/sofia-alvarez.png" color="var(--fndn-tag-red)" size="20" />
      <div className="min-w-0 flex-1">
        <p><span className="font-medium text-ink">Sofia Alvarez</span> <span className="text-ink-2">· 5 min ago</span></p>
        <p className="text-ink-2">Retries look good on staging. Can we ship #482 before the billing run on Dec 1?</p>
      </div>
    </div>
  );
}
