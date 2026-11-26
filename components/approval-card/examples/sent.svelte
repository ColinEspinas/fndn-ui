<script lang="ts">
  import { ApprovalCard } from "@fndn/svelte";

  const questions = [
    {
      q: "When should I migrate the bookings table (2.4M rows)?",
      type: "radio",
      options: [
        "Now, with a 40-second write lock",
        "Tonight at 02:00 UTC, the quietest hour",
        "Online in batches, about 25 minutes",
      ],
    },
    {
      q: "Where should it run first?",
      type: "check",
      options: ["Staging", "EU production", "US production"],
    },
    {
      q: "If a health check fails afterwards, what should I do?",
      type: "radio",
      options: [
        "Roll back automatically",
        "Pause and page Maya Chen",
        "Keep going and log it",
      ],
    },
  ];

  const answers = { "0": [2], "1": [0, 1], "2": [1] };

  let index = $state(2);

  let state = $state("sent");
</script>

<ApprovalCard
  questions={questions}
  bind:index={index}
  bind:state={state}
  defaultAnswers={answers}
/>
