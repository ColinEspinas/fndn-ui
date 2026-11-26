import { Kbd } from "@fndn/react";

/* boxed keys sit on the text's line, at the text's size */
export default function InASentence() {
  return (
    <p className="max-w-80 text-sm text-ink-2">
      Press <Kbd keys={["⌘", "K"]} /> to search projects, deploys and people. <Kbd keys={["Esc"]} /> closes the search.
    </p>
  );
}
