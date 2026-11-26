/* Dev only: reload the open page when a file it shows was saved (lib/vite-live-reload.mjs sends
 * the pages a file affects). Saves within 300 ms of each other give one reload. Imported by the
 * tree, which is on every page; in a build `import.meta.hot` is undefined and nothing runs. */
const affects = (pages: string[], here: string) =>
  pages.some((p) => p === "*" || (p.endsWith("/") && p !== "/" ? here.startsWith(p) : here === p));

if (import.meta.hot) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  import.meta.hot.on("docs:reload", ({ pages }: { pages: string[] }) => {
    const here = location.pathname.replace(/(.)\/$/, "$1");
    if (!affects(pages, here)) return;
    clearTimeout(timer);
    timer = setTimeout(() => location.reload(), 300);
  });
}
