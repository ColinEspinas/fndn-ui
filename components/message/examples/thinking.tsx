import { Message } from "@fndn/react";

/* streaming with nothing yet: aria-busy and a shimmering "Thinking…"; actions wait for the answer */
export default function Thinking() {
  return (
    <div className="w-80">
      <Message role="assistant" name="Assistant" avatar streaming actions={["copy", "retry"]} />
    </div>
  );
}
