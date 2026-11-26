<script lang="ts">
  import { Checkbox } from "@fndn/svelte";

  /* select all: checked when every child is, indeterminate when some are */
  const ENVIRONMENTS = ["Production", "Staging", "Preview"];

  let picked = $state<string[]>(["Production"]);
  const all = $derived(picked.length === ENVIRONMENTS.length ? true : picked.length ? "indeterminate" : false);
  const toggle = (env: string, on: boolean) => (picked = on ? [...picked, env] : picked.filter((p) => p !== env));
</script>

<div class="flex flex-col gap-2.5">
  <Checkbox label="Redeploy in all environments" checked={all} oncheckedchange={(v) => (picked = v === true ? ENVIRONMENTS : [])} />
  <div class="flex flex-col gap-2.5 ps-6">
    {#each ENVIRONMENTS as env (env)}
      <Checkbox label={env} checked={picked.includes(env)} oncheckedchange={(v) => toggle(env, v === true)} />
    {/each}
  </div>
</div>
