import { useState } from "react";
import { Button, Field, Input, Popover } from "@fndn/react";

/* edit one value where it is shown; Save closes the popover (open is controlled) */
export default function SpendLimit() {
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState("500");
  const [draft, setDraft] = useState(limit);

  return (
    <div className="flex w-80 items-center justify-between gap-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-ink">Monthly spend limit</span>
        <span className="text-xs text-ink-2">$312.40 used this month</span>
      </div>
      <Popover
        open={open}
        onOpenChange={(next) => { setOpen(next); setDraft(limit); }}
        placement="bottom-end"
        title="Monthly spend limit"
        description="Deploys pause when usage reaches the limit. Owners get an email at 80%."
        trigger={<Button size="sm">${Number(limit).toLocaleString("en-US")}</Button>}
      >
        <form className="flex items-end gap-2" onSubmit={(event) => { event.preventDefault(); setLimit(draft); setOpen(false); }}>
          <Field label="Limit in USD" className="flex-1">
            <Input inputMode="numeric" value={draft} onChange={(event) => setDraft(event.target.value)} />
          </Field>
          <Button type="submit" variant="primary">Save</Button>
        </form>
      </Popover>
    </div>
  );
}
