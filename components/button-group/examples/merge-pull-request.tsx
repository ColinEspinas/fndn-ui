import { CaretDown } from "@phosphor-icons/react";
import { Button, ButtonGroup, Menu, Tooltip } from "@fndn/react";

/* a split button: the common action, and a menu of the other ways to do it */
const ways = [
  { value: "squash", label: "Squash and merge" },
  { value: "rebase", label: "Rebase and merge" },
];

export default function MergePullRequest() {
  return (
    <ButtonGroup label="Merge #482">
      <Button variant="primary">Merge pull request</Button>
      <Menu placement="bottom-end" items={ways}>
        <Tooltip content="More ways to merge">
          <Button variant="primary" square aria-label="More ways to merge" icon={<CaretDown data-slot="icon" weight="bold" />} />
        </Tooltip>
      </Menu>
    </ButtonGroup>
  );
}
