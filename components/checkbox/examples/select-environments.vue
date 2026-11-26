<script setup lang="ts">
import { computed, ref } from "vue";
import { Checkbox } from "@fndn/vue";

/* select all: checked when every child is, indeterminate when some are */
const ENVIRONMENTS = ["Production", "Staging", "Preview"];

const picked = ref<string[]>(["Production"]);
const all = computed(() => (picked.value.length === ENVIRONMENTS.length ? true : picked.value.length ? "indeterminate" : false));
const toggle = (env: string, on: boolean) => (picked.value = on ? [...picked.value, env] : picked.value.filter((p) => p !== env));
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <Checkbox label="Redeploy in all environments" :checked="all" @update:checked="(v) => (picked = v === true ? ENVIRONMENTS : [])" />
    <div class="flex flex-col gap-2.5 ps-6">
      <Checkbox
        v-for="env in ENVIRONMENTS"
        :key="env"
        :label="env"
        :checked="picked.includes(env)"
        @update:checked="(v) => toggle(env, v === true)"
      />
    </div>
  </div>
</template>
