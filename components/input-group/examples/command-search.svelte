<script lang="ts">
  import MagnifyingGlass from "phosphor-svelte/lib/MagnifyingGlassIcon";
  import { InputGroup, Kbd } from "@fndn/svelte";
</script>

<!-- the top bar's search: the Kbd addon tells the shortcut that focuses it from anywhere -->
{#snippet start()}<MagnifyingGlass weight="bold" aria-hidden="true" />{/snippet}
{#snippet end()}<Kbd keys={["⌘", "K"]} />{/snippet}
<InputGroup {start} {end} placeholder="Search or jump to…" aria-label="Search Northwind" aria-keyshortcuts="Meta+K" class="w-full max-w-72" />
