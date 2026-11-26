import { useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Button, ButtonGroup } from "@fndn/react";

/* previous / next as one joined pair; the range beside it says where you are */
const TOTAL = 1284;
const PER_PAGE = 20;

export default function MembersPager() {
  const [page, setPage] = useState(1);
  const last = Math.ceil(TOTAL / PER_PAGE) - 1;
  const from = page * PER_PAGE + 1;
  const to = Math.min(TOTAL, from + PER_PAGE - 1);
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-ink-2 tabular-nums">{from}–{to} of 1,284 members</span>
      <ButtonGroup label="Pages">
        <Button size="sm" square aria-label="Previous page" disabled={page === 0} onClick={() => setPage(page - 1)} icon={<CaretLeft data-slot="icon" weight="bold" />} />
        <Button size="sm" square aria-label="Next page" disabled={page === last} onClick={() => setPage(page + 1)} icon={<CaretRight data-slot="icon" weight="bold" />} />
      </ButtonGroup>
    </div>
  );
}
