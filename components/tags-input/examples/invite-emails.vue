<script setup lang="ts">
import { computed, ref } from "vue";
import { TagsInput } from "@fndn/vue";

const emails = ref<string[]>(["priya@northwind.example", "lucas@northwind"]);
const invalid = computed(() => emails.value.some((email) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)));
</script>

<!-- controlled: paste a list of addresses, check each one -->
<template>
  <div class="flex flex-col gap-2" style="width: 320px">
    <TagsInput v-model:value="emails" label="Invite by email" :invalid="invalid" placeholder="name@northwind.example" />
    <span class="text-sm text-ink-2">
      {{ invalid ? "Every address needs a domain, like .example." : `${emails.length} ${emails.length === 1 ? "invite" : "invites"} will be sent.` }}
    </span>
  </div>
</template>
