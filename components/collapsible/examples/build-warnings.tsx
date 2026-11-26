import { Collapsible } from "@fndn/react";

/* inline: a text-sized header on the line, for details under a message */
export default function BuildWarnings() {
  return (
    <div className="flex w-80 flex-col gap-1 text-md text-ink">
      <p>docs-site is live on Production.</p>
      <Collapsible
        variant="inline"
        label="Built with 2 warnings"
        detail="The image hero.png is 2.4 MB, over the 1 MB budget. The page /changelog has no description."
      />
    </div>
  );
}
