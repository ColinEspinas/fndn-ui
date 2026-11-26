import { Checkbox } from "@fndn/react";

/* disabled: the option is shown so people know it exists, with the reason beside it */
export default function PlanLocked() {
  return (
    <div className="flex flex-col gap-1">
      <Checkbox label="Sign in with SAML single sign-on" disabled />
      <p className="ps-6 text-xs text-ink-2">Available on the Business plan.</p>
    </div>
  );
}
