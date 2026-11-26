<script lang="ts">
  import { SelectionActions } from "@fndn/svelte";

  const actions = [
    {
      value: "improve",
      label: "Improve",
      icon: "sparkle",
      busyLabel: "Improving",
    },
  ];

  let text = $state("Thanks for flagging this, and sorry for the confusion on Monday. Reminders scheduled before 6 a.m. were going out an hour late after the daylight saving change, and we shipped a fix this morning.");

  let selection = $state({ start: 65, end: 195 });

  let open = $state(true);
</script>

<SelectionActions
  bind:text={text}
  bind:selection={selection}
  bind:open={open}
  busy
  busyLabel="Improving"
  actions={actions}
  style="width: 420px"
/>
