import { useState } from "react";
import { Button, Textarea } from "@fndn/react";

/* starts at three lines and grows a line at a time as you type */
export default function ReviewComment() {
  const [comment, setComment] = useState("");
  return (
    <div className="flex w-full max-w-80 flex-col gap-2">
      <Textarea
        aria-label="Comment on #482 Add retry to webhook delivery"
        placeholder="Leave a comment"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={() => setComment("")}>Cancel</Button>
        <Button size="sm" variant="primary" disabled={comment.trim() === ""}>Comment</Button>
      </div>
    </div>
  );
}
