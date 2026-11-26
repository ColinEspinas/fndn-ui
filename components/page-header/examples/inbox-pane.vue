<script setup lang="ts">
import { computed, ref } from "vue";
import { Avatar, Button, PageHeader, ScrollArea } from "@fndn/vue";

const items = ref([
  { id: 1, who: "Priya Raman", initials: "PR", color: "var(--fndn-tag-purple)", what: "requested your review on #482 Add retry to webhook delivery", when: "2 min", unread: true },
  { id: 2, who: "Daniel Okafor", initials: "DO", color: "var(--fndn-tag-blue)", what: "assigned you NW-479 Usage alerts fire twice", when: "1 h", unread: true },
  { id: 3, who: "Aiko Tanaka", initials: "AT", color: "var(--fndn-tag-green)", what: "mentioned you in NW-471 Invoice PDF cuts the tax line", when: "3 h", unread: true },
  { id: 4, who: "Lucas Moreau", initials: "LM", color: "var(--fndn-tag-cyan)", what: "closed NW-466 Retry button stays disabled", when: "Nov 14", unread: false },
  { id: 5, who: "Sofia Alvarez", initials: "SA", color: "var(--fndn-tag-orange)", what: "commented on NW-458 Export usage as CSV", when: "Nov 12", unread: false },
]);
const unread = computed(() => items.value.filter((n) => n.unread).length);
const markAllRead = () => (items.value = items.value.map((n) => ({ ...n, unread: false })));
</script>

<!-- size="pane": the one-row header of a list in a pane, the count beside the title, its action at
     the end; the rows under it start on the title's 16px edge -->
<template>
  <section class="flex h-[320px] w-[380px] max-w-full flex-col overflow-hidden rounded-card bg-surface shadow-card" aria-label="Inbox">
    <PageHeader size="pane" :level="2" title="Inbox" :description="unread ? `${unread} unread` : 'All caught up'">
      <template v-if="unread > 0" #actions>
        <Button size="sm" variant="ghost" muted @click="markAllRead">Mark all as read</Button>
      </template>
    </PageHeader>
    <ScrollArea class="min-h-0 flex-1" aria-label="Notifications">
      <ul class="flex flex-col">
        <li v-for="n in items" :key="n.id" class="flex items-start gap-2.5 border-b border-line-soft px-4 py-2.5 text-sm">
          <Avatar :initials="n.initials" :color="n.color" size="20" />
          <p class="min-w-0 flex-1 text-ink-2">
            <span :class="n.unread ? 'font-medium text-ink' : 'text-ink-2'">{{ n.who }}</span> {{ n.what }}
          </p>
          <span class="flex shrink-0 items-center gap-1.5 text-xs leading-5 text-ink-2">
            {{ n.when }}
            <!-- the dot keeps its place when read, so the times stay on one edge -->
            <span :class="`size-1.5 rounded-full ${n.unread ? 'bg-accent' : ''}`" aria-hidden="true" />
            <span v-if="n.unread" class="sr-only">Unread</span>
          </span>
        </li>
      </ul>
    </ScrollArea>
  </section>
</template>
