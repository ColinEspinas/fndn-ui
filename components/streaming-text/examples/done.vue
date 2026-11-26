<script setup lang="ts">
import { ref } from "vue";
import { StreamingText } from "@fndn/vue";

const words = (sentence: string) => sentence.split(" ").map((text) => ({ text }));

/* a token with `cite` is the chip of that source */
const content = [
  ...words("Support logged 27 tickets about double bookings this week, up from 9 the week before."),
  { text: "", cite: 0 },
  ...words("All but two come from workspaces on calendar sync 4.12, released on Monday."),
  { text: "", cite: 1 },
  ...words("Maya Chen's team has a fix in review."),
  { text: "", cite: 2 },
];

const sources = [
  {
    name: "Support tickets",
    domain: "support.harbor.dev",
    href: "https://support.harbor.dev/tickets?tag=double-booking",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%231f7a5f'/%3E%3Cpath d='M19 18h26a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5H31l-9 7v-7h-3a5 5 0 0 1-5-5V23a5 5 0 0 1 5-5Z' fill='%23fff'/%3E%3C/svg%3E",
  },
  {
    name: "Release notes 4.12",
    domain: "harbor.dev",
    href: "https://harbor.dev/changelog/4-12",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%23e56d24'/%3E%3Cpath d='M20 22h24M20 32h24M20 42h16' fill='none' stroke='%23fff' stroke-width='5' stroke-linecap='round'/%3E%3C/svg%3E",
  },
  {
    name: "harbor/api #1931",
    domain: "github.com",
    href: "https://github.com/harbor/api/pull/1931",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%2324292f'/%3E%3Cpath d='M24 25v14M42 31c0 8-6 10-13 11' fill='none' stroke='%23fff' stroke-width='4' stroke-linecap='round'/%3E%3Ccircle cx='24' cy='20' r='5' fill='%23fff'/%3E%3Ccircle cx='24' cy='44' r='5' fill='%23fff'/%3E%3Ccircle cx='42' cy='26' r='5' fill='%23fff'/%3E%3C/svg%3E",
  },
];

const followUps = ["Draft a reply to the affected customers", "When does the fix ship"];

const sourcesOpen = ref(true);
</script>

<template>
  <StreamingText
    :content="content"
    :sources="sources"
    :followUps="followUps"
    done
    v-model:sourcesOpen="sourcesOpen"
    sourcesLabel="3 sources"
  />
</template>
