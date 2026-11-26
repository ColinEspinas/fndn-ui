import { Button, Input } from "@fndn/react";
import { Trash } from "@phosphor-icons/react";

/* mono for keys, values and anything copied from a terminal */
export default function EnvironmentVariable() {
  return (
    <div className="flex w-full max-w-[400px] items-center gap-2">
      <Input mono defaultValue="DATABASE_URL" aria-label="Key" className="w-36 min-w-0" />
      <Input mono defaultValue="postgres://web-app@db.northwind.example:5432/main" aria-label="Value" className="min-w-0 flex-1" />
      <Button variant="ghost" square muted aria-label="Remove DATABASE_URL" icon={<Trash data-slot="icon" weight="bold" />} />
    </div>
  );
}
