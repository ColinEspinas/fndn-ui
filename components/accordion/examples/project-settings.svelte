<script lang="ts">
  import { Accordion } from "@fndn/svelte";

  /* one open at a time; a setting the plan does not include stays shut */
  const settings = [
    { value: "build", label: "Build command", meta: "pnpm build", detail: "Runs on every push. Output goes to dist/ and is served from the edge." },
    { value: "env", label: "Environment variables", meta: "12", detail: "DATABASE_URL, SESSION_SECRET and 10 more, set per environment." },
    { value: "domains", label: "Domains", meta: "2", detail: "app.northwind.example (primary) and northwind-web.example." },
    { value: "sso", label: "Single sign-on", meta: "Business plan", disabled: true },
  ];
  let open = $state(["build"]);
</script>

<Accordion variant="card" bind:value={open} items={settings} style="width: 360px" />
