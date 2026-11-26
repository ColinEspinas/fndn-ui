import { ApprovalCard, Message, type ApprovalAction } from "@fndn/react";

const action: ApprovalAction = {
  title: "Run the tests in billing-api?",
  command: "pnpm --filter billing-api test",
  details: [{ label: "Branch", value: "fix/rate-limit", mono: true }],
};

/* the agent stops to ask: an approval card inside its message */
export default function AsksBeforeRunning() {
  return (
    <div className="w-80">
      <Message role="assistant" name="Assistant" avatar>
        <div className="flex flex-col gap-2">
          <p className="text-sm leading-[1.5]">I reset the window once a minute has passed. Shall I check it?</p>
          <ApprovalCard action={action} alwaysAllow />
        </div>
      </Message>
    </div>
  );
}
