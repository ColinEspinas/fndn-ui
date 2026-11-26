<script setup lang="ts">
import { Kbd } from "@fndn/vue";
</script>

<!-- boxed keys sit on the text's line, at the text's size -->
<template>
  <p class="max-w-80 text-sm text-ink-2">
    Press <Kbd :keys="['⌘', 'K']" /> to search projects, deploys and people. <Kbd :keys="['Esc']" /> closes the search.
  </p>
</template>
