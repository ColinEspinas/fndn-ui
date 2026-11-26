import { Checkbox } from "@fndn/react";

/* independent options under one heading: a fieldset and its legend name the group */
export default function EmailNotifications() {
  return (
    <fieldset className="flex w-80 flex-col gap-2.5">
      <legend className="mb-3 text-sm font-medium text-ink">Email me when</legend>
      <Checkbox name="email" value="deploy-failed" label="A deploy to Production fails" defaultChecked />
      <Checkbox name="email" value="review-requested" label="Someone requests my review" defaultChecked />
      <Checkbox name="email" value="usage" label="Usage passes 80% of the Team plan" />
    </fieldset>
  );
}
