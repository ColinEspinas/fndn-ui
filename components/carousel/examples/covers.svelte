<script lang="ts">
  import { Carousel } from "@fndn/svelte";

  /* A cover is a landscape in four layers. Each is a picture of its own (data-carousel="picture")
   * with its share of the lag (--fndn-carousel-parallax): the sun stays behind the longest, then the
   * far range, then the hills, and the pines in front hardly at all, so they slide past each other
   * as the slide crosses, as a landscape does from a train window. With a photo, mark the <img> the
   * same way. Every layer is drawn 960 wide around one centre: a slide shows the middle of it, and
   * the lag brings the rest into view. Each ridge is painted twice, the slide's colour under its own,
   * so nothing behind shows through it. Drawn in the theme's colours. */
  const PINE = "l9 16h-5l8 14h-24l8 -14h-5z";
  const TALL = "l11 20h-6l10 18h-30l10 -18h-6z";
  const LAYERS = [
    { share: 2, d: "M0 208V140L60 118L110 132L180 84L230 120L290 70L350 126L400 104L460 60L530 122L590 92L650 130L720 76L790 124L850 98L910 128L960 110V208Z" },
    { share: 1, d: "M0 208V150C60 120 120 120 180 146S300 176 360 150S470 112 540 140S660 172 720 146S840 116 900 140L960 150V208Z" },
    { share: 0.4, d: `M0 208V176C80 158 160 162 240 178S400 196 480 176S640 150 720 172S880 190 960 170V208ZM96 137${PINE}M132 130${TALL}M404 162${PINE}M548 136${PINE}M580 124${TALL}M618 131${PINE}M800 159${PINE}M836 152${TALL}` },
  ];
  const covers = [
    { name: "Alpine dawn", by: "Mara Lindqvist", sky: "from-orange/35 to-orange-tint", sun: "fill-red/70", at: [404, 88], tones: ["fill-orange/30", "fill-orange/60", "fill-orange"], flip: false },
    { name: "Glacier noon", by: "Tomás Oyelaran", sky: "from-accent/35 to-accent-tint", sun: "fill-orange", at: [566, 50], tones: ["fill-accent/30", "fill-accent/60", "fill-accent"], flip: true },
    { name: "Fern valley", by: "Hana Ito", sky: "from-green/35 to-green-tint", sun: "fill-orange", at: [470, 66], tones: ["fill-green/30", "fill-green/60", "fill-green"], flip: false },
    { name: "Red desert", by: "Priya Raman", sky: "from-red/35 to-red-tint", sun: "fill-orange", at: [600, 92], tones: ["fill-red/30", "fill-red/60", "fill-red"], flip: true },
  ];
  const layer = "absolute inset-y-0 start-0 h-full";
</script>

<Carousel class="w-96 max-w-full" label="Workspace covers" effect="parallax" loop="endless" indicators items={covers.map((cover) => ({ label: cover.name }))}>
  {#snippet slide({ index })}
    {@const cover = covers[index]!}
    <div class="flex h-full flex-col bg-inset">
      <div class="relative h-52 overflow-hidden bg-linear-to-b {cover.sky}" aria-hidden="true">
        <svg data-carousel="picture" style="--fndn-carousel-parallax: 3" viewBox="0 0 960 208" preserveAspectRatio="xMidYMax slice" class={layer}>
          <circle cx={cover.at[0]} cy={cover.at[1]} r="26" class={cover.sun} />
        </svg>
        {#each LAYERS as ridge, i (i)}
          <svg data-carousel="picture" style="--fndn-carousel-parallax: {ridge.share}" viewBox="0 0 960 208" preserveAspectRatio="xMidYMax slice" class={layer}>
            <g transform={cover.flip ? "translate(960 0) scale(-1 1)" : undefined}>
              <path d={ridge.d} class="fill-inset" />
              <path d={ridge.d} class={cover.tones[i]} />
            </g>
          </svg>
        {/each}
      </div>
      <div class="flex flex-col gap-0.5 p-3 text-sm">
        <p class="font-medium text-ink">{cover.name}</p>
        <p class="text-xs text-ink-2">Illustration by {cover.by}</p>
      </div>
    </div>
  {/snippet}
</Carousel>
