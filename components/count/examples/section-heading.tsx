import { Count } from "@fndn/react";

/* plain: the count in the heading's own size, quieter */
export default function SectionHeading() {
  return (
    <div className="flex w-72 flex-col gap-1">
      <h3 className="flex items-baseline gap-2 text-md font-medium text-ink">
        Members <Count>1,284</Count>
      </h3>
      <p className="text-sm text-ink-2">Everyone in Northwind, including 3 pending invites.</p>
    </div>
  );
}
