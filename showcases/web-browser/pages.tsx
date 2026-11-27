/* What the browser shows in its page area: a few simple sites, the new tab page, search results,
 * and the browser's own History and Settings pages. Every page is plain layout around the
 * system's components; links are real anchors that navigate inside the window. */
import { useState, type MouseEvent, type ReactNode } from "react";
import {
  Alert, Avatar, Button, Card, CardBody, CardDescription, CardHeader, CardTitle, CodeBlock, EmptyState,
  InputGroup, Link as UiLink, PageHeader, SegmentedControl, Select, StatusPill, Switch, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tag,
} from "@fndn/react";
import { ClockCounterClockwise, DownloadSimple, Gear, MagnifyingGlass, Browsers, Trash } from "@phosphor-icons/react";
import { BOOKMARKS, ENGINES, HISTORY, HOME, SETTINGS, SITES, searchQuery, siteOf, type Visit } from "./data";

export type Settings = { bookmarksBar: boolean; askWhereToSave: boolean; zoom: string; engine: string };
type Go = (url: string) => void;

/** The page's icon: the browser's own pages get a glyph, sites a lettered mark (14px in a tab). */
export function Favicon({ url, size = 16 }: { url: string; size?: 14 | 16 | 24 }) {
  if (url === HISTORY) return <ClockCounterClockwise data-slot="icon" weight="bold" aria-hidden />;
  if (url === SETTINGS) return <Gear data-slot="icon" weight="bold" aria-hidden />;
  if (url === HOME) return <Browsers data-slot="icon" weight="bold" aria-hidden />;
  const site = siteOf(url);
  return <Avatar shape="square" size={size} initials={site.mark} color={site.color} />;
}

/** A link that navigates inside the window. */
function Link({ to, go, children }: { to: string; go: Go; children: ReactNode }) {
  const click = (e: MouseEvent) => {
    e.preventDefault();
    go(to);
  };
  return <UiLink href={`https://${to}`} onClick={click}>{children}</UiLink>;
}

const Prose = ({ children }: { children: ReactNode }) => (
  /* a web page keeps its own direction, whatever the browser's interface uses (an English page stays
   * left to right in a right-to-left browser): the content decides */
  <article dir="auto" className="mx-auto flex max-w-[680px] flex-col gap-4 px-6 py-10 text-md leading-relaxed text-ink-2 max-sm:px-4 max-sm:py-6">{children}</article>
);
const H1 = ({ children }: { children: ReactNode }) => <h1 className="text-xl font-semibold text-ink">{children}</h1>;

function NewTab({ go, engine }: { go: Go; engine: string }) {
  const [q, setQ] = useState("");
  const name = ENGINES.find((e) => e.value === engine)?.label;
  return (
    <div className="mx-auto flex max-w-[560px] flex-col items-center gap-6 px-4 pt-[12vh] pb-10">
      <h1 className="text-xl font-semibold text-ink">Good morning</h1>
      <form className="w-full" onSubmit={(e) => { e.preventDefault(); if (q.trim()) go(q); }}>
        <InputGroup size="lg" aria-label={`Search with ${name}`} placeholder={`Search with ${name} or type a URL`} value={q} onChange={(e) => setQ(e.target.value)} start={<MagnifyingGlass data-slot="icon" weight="bold" />} enterKeyHint="go" />
      </form>
      {/* Chrome's shortcut tiles: the site's mark on a round field over its name (which wraps) */}
      <nav aria-label="Shortcuts" className="flex flex-wrap justify-center gap-1">
        {BOOKMARKS.map((b) => (
          <a key={b.url} href={`https://${b.url}`} onClick={(e) => { e.preventDefault(); go(b.url); }}
            className="flex w-24 flex-col items-center gap-2 rounded-card px-1 pt-3 pb-2 text-center text-xs text-ink-2 [overflow-wrap:anywhere] hover:bg-hover hover:text-ink motion-colors-fast motion-transform-press [:root:not([data-fndn-input=keyboard])_&:active]:scale-press">
            <span className="grid size-12 place-items-center rounded-full bg-field"><Favicon url={b.url} size={24} /></span>
            {b.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

function SearchResults({ engine, q, go }: { engine: string; q: string; go: Go }) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = SITES.filter((s) => !s.url.startsWith("ui://") && words.some((w) => s.title.toLowerCase().includes(w) || s.url.includes(w)));
  return (
    <Prose>
      <p className="text-sm text-ink-2">{engine} · results for <span className="text-ink">“{q}”</span></p>
      {hits.length === 0 && <EmptyState icon="magnifying-glass" title="No results" hint="Try fewer or different words." />}
      {hits.map((s) => (
        <div key={s.url} className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2 text-sm text-ink-2"><Favicon url={s.url} />{s.url}</span>
          <Link to={s.url} go={go}><span className="text-lg">{s.title}</span></Link>
        </div>
      ))}
    </Prose>
  );
}

function DocsPage({ go, download }: { go: Go; download: () => void }) {
  return (
    <Prose>
      <Tag tone="blue" className="self-start">Docs</Tag>
      <H1>Getting started</H1>
      <p>Harbor deploys every push to a fresh URL. Install the CLI, link a project, and your next commit ships to a preview.</p>
      <CodeBlock variant="command" value="npm install --global @harbor/cli" />
      <p>
        No npm? <UiLink href="https://harbor.dev/download/harbor-cli-2.4.0-linux-x64.tar.gz" onClick={(e: MouseEvent) => { e.preventDefault(); download(); }}>
          <DownloadSimple data-slot="icon" weight="bold" aria-hidden className="me-1 inline align-[-2px]" />Download the CLI for Linux</UiLink> (20.3&nbsp;MB).
      </p>
      <p>Then run <code className="font-mono text-sm text-ink">harbor link</code> in your repository and follow the prompts.</p>
      <Alert tone="accent" title="Preview deploys are on by default">Turn them off per branch in the project settings.</Alert>
      <p>Next: <Link to="harbor.dev/docs/preview-deploys" go={go}>Preview deploys</Link> · <Link to="status.harbor.dev" go={go}>Service status</Link></p>
    </Prose>
  );
}

const SERVICES: [string, "green" | "orange"][] = [["Deploys", "green"], ["Builds", "green"], ["Edge network", "green"], ["Logs", "orange"]];
function StatusPage() {
  return (
    <Prose>
      <H1>Harbor Status</H1>
      <Alert tone="orange" title="Degraded: log search">Log search is slower than usual in eu-west. Deploys are not affected. Updated 09:40 UTC.</Alert>
      <Card>
        {SERVICES.map(([name, tone]) => (
          <CardBody key={name} className="flex items-center justify-between gap-4 border-b border-line-soft last:border-0">
            <span className="text-ink">{name}</span>
            <StatusPill tone={tone}>{tone === "green" ? "Operational" : "Degraded"}</StatusPill>
          </CardBody>
        ))}
      </Card>
    </Prose>
  );
}

function Article({ url, go }: { url: string; go: Go }) {
  const site = siteOf(url);
  return (
    <Prose>
      <p className="text-sm text-ink-2">{url.split("/")[0]}</p>
      <H1>{site.title}</H1>
      <p>Every pull request now gets its own preview URL, posted as a comment on the pull request and torn down when it merges. Reviewers click through the change instead of reading about it.</p>
      <p>Previews share the production build cache, so most of them are live in under a minute. Read <Link to="harbor.dev/docs/preview-deploys" go={go}>the guide</Link> to set protection rules and environment variables per branch.</p>
    </Prose>
  );
}

function Unreachable({ url, reload }: { url: string; reload: () => void }) {
  return (
    <div className="mx-auto flex max-w-[480px] flex-col items-start gap-4 px-6 pt-[12vh]">
      <EmptyState size="block" icon="file" title="This site can’t be reached" hint={`${url.split("/")[0]} took too long to respond. Check the address, or try again.`} />
      <Button variant="outline" size="sm" onClick={reload}>Try again</Button>
    </div>
  );
}

const DAYS = [{ value: "all", label: "All time" }, { value: "today", label: "Today" }, { value: "yesterday", label: "Yesterday" }, { value: "week", label: "Earlier this week" }];
function HistoryPage({ visits, go, clear }: { visits: Visit[]; go: Go; clear: () => void }) {
  const [q, setQ] = useState("");
  const [day, setDay] = useState("all");
  const shown = visits.filter((v) => (day === "all" || v.day === day) && `${siteOf(v.url).title} ${v.url}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-4 px-6 py-8 max-sm:px-4">
      <PageHeader
        title="History"
        actions={<Button size="sm" variant="secondary" icon={<Trash data-slot="icon" weight="bold" />} onClick={clear} disabled={!visits.length}>Clear browsing data</Button>}
      />
      <div className="flex flex-wrap gap-2">
        <InputGroup className="min-w-[200px] flex-1" aria-label="Search history" placeholder="Search history" value={q} onChange={(e) => setQ(e.target.value)} start={<MagnifyingGlass data-slot="icon" weight="bold" />} />
        <Select className="w-44" aria-label="When" items={DAYS} value={day} onValueChange={(v) => setDay(v ?? "all")} />
      </div>
      {shown.length === 0 ? (
        <EmptyState size="block" icon="magnifying-glass" title={visits.length ? "No pages match" : "Your history is empty"} hint={visits.length ? "Try another word or time range." : "Pages you visit appear here."} />
      ) : (
        <Table aria-label="Visited pages">
          <TableHeader>
            <TableRow><TableHead>Page</TableHead><TableHead numeric>Visited</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((v, i) => (
              <TableRow key={`${v.url}-${i}`}>
                <TableCell>
                  <span className="flex min-w-0 items-center gap-2">
                    <Favicon url={v.url} />
                    <Link to={v.url} go={go}>{siteOf(v.url).title}</Link>
                    <span className="truncate text-ink-2 max-sm:hidden" title={v.url}>{v.url.split("/")[0]}</span>
                  </span>
                </TableCell>
                <TableCell numeric className="whitespace-nowrap">{v.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

/** One setting: its name and hint at the start, its control at the end (under them when narrow). */
const Row = ({ title, hint, children }: { title: string; hint: string; children: ReactNode }) => (
  <CardBody className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line-soft last:border-0">
    <div className="flex min-w-[200px] flex-1 flex-col gap-0.5"><span className="text-ink">{title}</span><span className="text-sm text-ink-2">{hint}</span></div>
    {children}
  </CardBody>
);

function SettingsPage({ settings, set }: { settings: Settings; set: (patch: Partial<Settings>) => void }) {
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4 px-6 py-8 max-sm:px-4">
      <PageHeader title="Settings" />
      <Card>
        <CardHeader><CardTitle>Appearance</CardTitle><CardDescription>How pages look in this window.</CardDescription></CardHeader>
        <Row title="Show bookmarks bar" hint="Your bookmarks under the address bar.">
          <Switch label="Show bookmarks bar" checked={settings.bookmarksBar} onCheckedChange={(v) => set({ bookmarksBar: v })} />
        </Row>
        <Row title="Page zoom" hint="Text and images on every site.">
          <SegmentedControl size="sm" aria-label="Page zoom" options={["90%", "100%", "125%"]} value={settings.zoom} onValueChange={(v) => set({ zoom: v })} />
        </Row>
      </Card>
      <Card>
        <CardHeader><CardTitle>Search and downloads</CardTitle></CardHeader>
        <Row title="Search engine" hint="Used by the address bar.">
          <Select className="w-44" aria-label="Search engine" items={ENGINES} value={settings.engine} onValueChange={(v) => v && set({ engine: v })} />
        </Row>
        <Row title="Ask where to save each file" hint="Otherwise files go to Downloads.">
          <Switch label="Ask where to save each file" checked={settings.askWhereToSave} onCheckedChange={(v) => set({ askWhereToSave: v })} />
        </Row>
      </Card>
    </div>
  );
}

/** The page area's content for a URL. */
export function Page(props: { url: string; go: Go; reload: () => void; download: () => void; settings: Settings; set: (patch: Partial<Settings>) => void; visits: Visit[]; clearHistory: () => void }) {
  const { url, go, settings } = props;
  const search = searchQuery(url);
  if (url === HOME) return <NewTab go={go} engine={settings.engine} />;
  if (url === HISTORY) return <HistoryPage visits={props.visits} go={go} clear={props.clearHistory} />;
  if (url === SETTINGS) return <SettingsPage settings={settings} set={props.set} />;
  if (search) return <SearchResults engine={search.engine} q={search.q} go={go} />;
  if (url === "harbor.dev/docs/getting-started") return <DocsPage go={go} download={props.download} />;
  if (url === "status.harbor.dev") return <StatusPage />;
  if (SITES.some((s) => s.url === url)) return <Article url={url} go={go} />;
  return <Unreachable url={url} reload={props.reload} />;
}
