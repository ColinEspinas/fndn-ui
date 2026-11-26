import { useState } from "react";
import { TagsInput } from "@fndn/react";

/* controlled: paste a list of addresses, check each one */
export default function InviteEmails() {
  const [emails, setEmails] = useState<string[]>(["priya@northwind.example", "lucas@northwind"]);
  const invalid = emails.some((email) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email));
  return (
    <div className="flex flex-col gap-2" style={{ width: 320 }}>
      <TagsInput label="Invite by email" value={emails} onValueChange={setEmails} invalid={invalid} placeholder="name@northwind.example" />
      <span className="text-sm text-ink-2">
        {invalid ? "Every address needs a domain, like .example." : `${emails.length} ${emails.length === 1 ? "invite" : "invites"} will be sent.`}
      </span>
    </div>
  );
}
