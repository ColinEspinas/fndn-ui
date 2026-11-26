import { useState } from "react";
import { Message, Textarea } from "@fndn/react";

const QUESTION = "Which invoices failed to send in November?";

/* Edit turns the bubble into a field; Enter keeps the new text */
export default function EditYourQuestion() {
  const [text, setText] = useState(QUESTION);
  const [editing, setEditing] = useState(false);
  return (
    <div className="flex w-80 flex-col items-end">
      {editing ? (
        <Textarea
          autoFocus aria-label="Edit your message" defaultValue={text} rows={2}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); setText(e.currentTarget.value.trim() || text); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
        />
      ) : (
        <Message role="user" name="Maya Chen" time="10:42" text={text} actions={["copy", "edit"]} onAction={(a) => a === "edit" && setEditing(true)} />
      )}
    </div>
  );
}
