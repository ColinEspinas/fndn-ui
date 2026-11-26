<script lang="ts">
  import { TagsInput } from "@fndn/svelte";

  let reviewers = $state(["Priya Raman", "Daniel Okafor"]);
</script>

<!-- max: the input stops taking tags at three -->
<TagsInput bind:value={reviewers} label="Required reviewers, up to 3" max={3} placeholder="Add a reviewer" style="width: 320px" />
