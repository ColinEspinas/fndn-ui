<script setup lang="ts">
import { ref } from "vue";
import { PhCopy } from "@phosphor-icons/vue";
import { Button, InputGroup, Tooltip } from "@fndn/vue";

const copied = ref(false);
const key = "nw_live_4f9a2c71e0b8d3";
function copy() {
  void navigator.clipboard?.writeText(key);
  copied.value = true;
}
</script>

<!-- a Button in an addon: ghost, xs, square, muted, named by its tooltip -->
<template>
  <InputGroup readonly mono :value="key" aria-label="API key" class="w-full max-w-80">
    <template #end>
      <Tooltip :content="copied ? 'Copied' : 'Copy'">
        <Button variant="ghost" size="xs" square muted aria-label="Copy API key" @click="copy">
          <template #icon><PhCopy data-slot="icon" weight="bold" /></template>
        </Button>
      </Tooltip>
    </template>
  </InputGroup>
</template>
