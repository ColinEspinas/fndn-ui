<script setup lang="ts">
import { PhCaretDown } from "@phosphor-icons/vue";
import { Button, ButtonGroup, Menu, Tooltip } from "@fndn/vue";

/* a split button: the common action, and a menu of the other ways to do it */
const ways = [
  { value: "squash", label: "Squash and merge" },
  { value: "rebase", label: "Rebase and merge" },
];
</script>

<template>
  <ButtonGroup label="Merge #482">
    <Button variant="primary">Merge pull request</Button>
    <Menu placement="bottom-end" :items="ways">
      <template #trigger>
        <Tooltip content="More ways to merge">
          <Button variant="primary" square aria-label="More ways to merge">
            <template #icon><PhCaretDown data-slot="icon" weight="bold" /></template>
          </Button>
        </Tooltip>
      </template>
    </Menu>
  </ButtonGroup>
</template>
