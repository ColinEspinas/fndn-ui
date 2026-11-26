<script lang="ts">
  import Bell from "phosphor-svelte/lib/BellIcon";
  import DeviceMobile from "phosphor-svelte/lib/DeviceMobileIcon";
  import EnvelopeSimple from "phosphor-svelte/lib/EnvelopeSimpleIcon";
  import Link from "phosphor-svelte/lib/LinkIcon";
  import { Listbox } from "@fndn/svelte";

  /* an icon says what kind of channel, a one-line description where it goes; a long one is cut, with a title */
  const channels = [
    { value: "email", label: "Email", description: "maya@northwind.example and 3 teammates", icon: EnvelopeSimple },
    { value: "sms", label: "Text message", description: "+1 (555) 014-2290", icon: DeviceMobile },
    { value: "webhook", label: "Webhook", description: "POST https://hooks.northwind.example/deploys/web-app", icon: Link },
    { value: "inbox", label: "Workspace inbox", description: "No email, shown when you sign in", icon: Bell },
  ];

  let selected = $state(["email", "webhook"]);
</script>

<Listbox items={channels} bind:value={selected} label="Send failed deploy alerts to" selectionMode="multiple" style="width: 320px" />
