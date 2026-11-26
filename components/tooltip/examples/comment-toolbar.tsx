import { Code, Link, Paperclip, TextB, TextItalic } from "@phosphor-icons/react";
import { Button, Input, Tooltip } from "@fndn/react";

const tools = [
  { label: "Bold", shortcut: "⌘B", icon: TextB },
  { label: "Italic", shortcut: "⌘I", icon: TextItalic },
  { label: "Code", shortcut: "⌘E", icon: Code },
  { label: "Link", shortcut: "⌘K", icon: Link },
  { label: "Attach a file", icon: Paperclip },
];

/* once one tooltip is open, its neighbours open at once, with no animation */
export default function CommentToolbar() {
  return (
    <div className="flex w-80 flex-col gap-2">
      <div className="flex gap-0.5" role="toolbar" aria-label="Formatting">
        {tools.map(({ label, shortcut, icon: Icon }) => (
          <Tooltip key={label} content={label} shortcut={shortcut}>
            <Button variant="ghost" size="sm" square aria-label={label} icon={<Icon data-slot="icon" weight="bold" />} />
          </Tooltip>
        ))}
      </div>
      <Input multiline rows={3} aria-label="Comment on #482" placeholder="Leave a review comment" />
    </div>
  );
}
