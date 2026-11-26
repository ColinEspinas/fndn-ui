import { Message, ToolChips, type ToolStep } from "@fndn/react";

const steps: ToolStep[] = [
  { icon: "read", label: "Read", chip: "dpl_7f3a9c/build.log", mono: true, detail: [{ text: "Step 3 of 5 exited with code 1" }] },
  { icon: "search", label: "Search code", chip: "DATABASE_URL", mono: true, detail: [{ text: "2 matches in billing-api" }] },
];
const ANSWER = "The build reads DATABASE_URL at start-up and Production does not define it. Add it, then redeploy.";

/* rich content goes in as children; Copy takes copyText */
export default function AnswerWithToolCalls() {
  return (
    <div className="w-80">
      <Message role="assistant" name="Assistant" avatar time="just now" actions={["copy", "good", "bad"]} copyText={ANSWER}>
        <div className="flex flex-col gap-2">
          <ToolChips steps={steps} labels={{ header: "2 tool calls" }} />
          <p className="text-sm leading-[1.5]">{ANSWER}</p>
        </div>
      </Message>
    </div>
  );
}
