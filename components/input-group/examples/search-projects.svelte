<script lang="ts">
  import MagnifyingGlass from "phosphor-svelte/lib/MagnifyingGlassIcon";
  import { InputGroup } from "@fndn/svelte";

  let query = $state("");
</script>

<!-- an icon addon is decoration: hidden from assistive technology, the input keeps its name -->
{#snippet start()}<MagnifyingGlass weight="bold" aria-hidden="true" />{/snippet}
<InputGroup bind:value={query} {start} type="search" placeholder="Search projects" aria-label="Search projects" class="w-full max-w-80" />
