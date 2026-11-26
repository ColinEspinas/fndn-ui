/* The project the editor has open: a small billing API with one failing test. Plain data, so the
 * app's files read as layout and state only. */
import type { CodeDiffRow, TreeViewNode } from "@fndn/react";

export const PROJECT = "billing-api";
export const BRANCH = "fix/rate-limit";

const rateLimit = [
  'import type { NextFunction, Request, Response } from "express";',
  "",
  "const WINDOW_MS = 60_000;",
  "const LIMIT = 120;",
  "",
  "type Bucket = { count: number; windowStart: number };",
  "const buckets = new Map<string, Bucket>();",
  "",
  "export function rateLimit(req: Request, res: Response, next: NextFunction) {",
  '  const key = req.header("x-api-key") ?? req.ip ?? "anonymous";',
  "  const now = Date.now();",
  "  let bucket = buckets.get(key);",
  "  if (!bucket) {",
  "    bucket = { count: 0, windowStart: now };",
  "    buckets.set(key, bucket);",
  "  }",
  "",
  "  bucket.count += 1;",
  "  if (bucket.count > LIMIT) {",
  "    const retryAfter = Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000);",
  '    res.set("Retry-After", String(Math.max(retryAfter, 1)));',
  '    return res.status(429).json({ error: "rate_limited", retryAfter });',
  "  }",
  "  next();",
  "}",
];

/** rate-limit.ts once the assistant's fix is applied: the window resets when it has passed. */
export const RATE_LIMIT_FIXED = [
  ...rateLimit.slice(0, 16),
  "",
  "  if (now - bucket.windowStart >= WINDOW_MS) {",
  "    bucket.count = 0;",
  "    bucket.windowStart = now;",
  "  }",
  ...rateLimit.slice(16),
];

const invoicesBefore = [
  'import { Router } from "express";',
  'import { db } from "../lib/db";',
  "",
  "export const invoices = Router();",
  "",
  'invoices.get("/", async (req, res) => {',
  "  const rows = await db.invoice.findMany({",
  "    where: { customerId: String(req.query.customer) },",
  '    orderBy: { issuedAt: "desc" },',
  "  });",
  "  res.json(rows);",
  "});",
  "",
  'invoices.get("/:id", async (req, res) => {',
  "  const row = await db.invoice.findUnique({ where: { id: req.params.id } });",
  '  if (!row) return res.status(404).json({ error: "not_found" });',
  "  res.json(row);",
  "});",
];

const invoices = [
  'import { Router } from "express";',
  'import { formatAmount } from "../lib/currency";',
  'import { db } from "../lib/db";',
  "",
  "export const invoices = Router();",
  "",
  'invoices.get("/", async (req, res) => {',
  "  const limit = Math.min(Number(req.query.limit ?? 50), 200);",
  "  const rows = await db.invoice.findMany({",
  "    where: { customerId: String(req.query.customer) },",
  '    orderBy: { issuedAt: "desc" },',
  "    take: limit,",
  "  });",
  "  const total = rows.reduce((sum, r) => sum + r.amountCents, 0);",
  "  res.json(rows.map((r) => ({ ...r, amount: formatAmount(r.amountCents, r.currency) })));",
  "});",
  "",
  'invoices.get("/:id", async (req, res) => {',
  "  const row = await db.invoice.findUnique({ where: { id: req.params.id } });",
  '  if (!row) return res.status(404).json({ error: "not_found" });',
  "  res.json({ ...row, amount: formatAmount(row.amountCents, row.currency) });",
  "});",
];

const currency = [
  "const formatters = new Map<string, Intl.NumberFormat>();",
  "",
  "/** 12345, \"EUR\" → \"€123.45\". Formatters are cached per currency. */",
  "export function formatAmount(cents: number, currency: string, locale = \"en-US\") {",
  "  const key = `${locale}:${currency}`;",
  "  let format = formatters.get(key);",
  "  if (!format) {",
  '    format = new Intl.NumberFormat(locale, { style: "currency", currency });',
  "    formatters.set(key, format);",
  "  }",
  "  return format.format(cents / 100);",
  "}",
];

/** Every file of the project, by path. */
export const FILES: Record<string, string[]> = {
  "src/server.ts": [
    'import express from "express";',
    'import { auth } from "./middleware/auth";',
    'import { rateLimit } from "./middleware/rate-limit";',
    'import { customers } from "./routes/customers";',
    'import { invoices } from "./routes/invoices";',
    "",
    "export const app = express();",
    "",
    "app.use(express.json());",
    "app.use(auth, rateLimit);",
    'app.use("/v1/customers", customers);',
    'app.use("/v1/invoices", invoices);',
    "",
    "const port = Number(process.env.PORT ?? 8080);",
    "app.listen(port, () => console.log(`billing-api on :${port}`));",
  ],
  "src/middleware/auth.ts": [
    'import type { NextFunction, Request, Response } from "express";',
    'import { db } from "../lib/db";',
    "",
    "export async function auth(req: Request, res: Response, next: NextFunction) {",
    '  const key = req.header("x-api-key");',
    '  if (!key) return res.status(401).json({ error: "missing_api_key" });',
    "  const account = await db.apiKey.findUnique({ where: { key } });",
    '  if (!account?.active) return res.status(403).json({ error: "inactive_key" });',
    "  res.locals.accountId = account.accountId;",
    "  next();",
    "}",
  ],
  "src/middleware/rate-limit.ts": rateLimit,
  "src/routes/customers.ts": [
    'import { Router } from "express";',
    'import { z } from "zod";',
    'import { db } from "../lib/db";',
    "",
    "export const customers = Router();",
    "",
    'customers.get("/:id", async (req, res) => {',
    "  const row = await db.customer.findUnique({ where: { id: req.params.id } });",
    '  if (!row) return res.status(404).json({ error: "not_found" });',
    "  res.json(row);",
    "});",
  ],
  "src/routes/invoices.ts": invoices,
  "src/lib/currency.ts": currency,
  "src/lib/db.ts": [
    'import { PrismaClient } from "@prisma/client";',
    "",
    "/** One client per process; Prisma pools the connections. */",
    "export const db = new PrismaClient({",
    '  log: process.env.NODE_ENV === "production" ? ["warn", "error"] : ["query"],',
    "});",
  ],
  "test/rate-limit.test.ts": [
    'import request from "supertest";',
    'import { afterEach, describe, expect, it, vi } from "vitest";',
    'import { app } from "../src/server";',
    "",
    'const call = () => request(app).get("/v1/invoices").set("x-api-key", "test_key");',
    "",
    'describe("rate limit", () => {',
    "  afterEach(() => vi.useRealTimers());",
    "",
    '  it("refuses the 121st call in a minute", async () => {',
    "    for (let i = 0; i < 120; i++) await call();",
    "    expect((await call()).status).toBe(429);",
    "  });",
    "",
    '  it("refills the bucket after the window", async () => {',
    "    vi.useFakeTimers();",
    "    for (let i = 0; i < 121; i++) await call();",
    "    vi.advanceTimersByTime(60_000);",
    "    expect((await call()).status).toBe(200);",
    "  });",
    "});",
  ],
  "package.json": [
    "{",
    '  "name": "billing-api",',
    '  "private": true,',
    '  "type": "module",',
    '  "scripts": {',
    '    "dev": "tsx watch src/server.ts",',
    '    "test": "vitest run",',
    '    "typecheck": "tsc --noEmit"',
    "  },",
    '  "dependencies": { "@prisma/client": "^6.4.0", "express": "^5.1.0", "zod": "^3.24.2" },',
    '  "devDependencies": { "supertest": "^7.1.0", "tsx": "^4.19.3", "vitest": "^3.2.4" }',
    "}",
  ],
  "README.md": [
    "# billing-api",
    "",
    "Invoices and customers for the dashboard, behind an API key.",
    "",
    "- `pnpm dev` starts the server on :8080",
    "- `pnpm test` runs the suite (vitest + supertest)",
    "- Every key may make 120 calls a minute; the 121st gets a 429 and a Retry-After header.",
  ],
};

const node = (path: string): TreeViewNode => ({ value: path, label: path.split("/").pop()! });

/** The explorer's tree. Icons are added by the app. */
export const TREE: TreeViewNode[] = [
  {
    value: "src", label: "src",
    children: [
      { value: "src/lib", label: "lib", children: [node("src/lib/currency.ts"), node("src/lib/db.ts")] },
      { value: "src/middleware", label: "middleware", children: [node("src/middleware/auth.ts"), node("src/middleware/rate-limit.ts")] },
      { value: "src/routes", label: "routes", children: [node("src/routes/customers.ts"), node("src/routes/invoices.ts")] },
      node("src/server.ts"),
    ],
  },
  { value: "test", label: "test", children: [node("test/rate-limit.test.ts")] },
  node("package.json"),
  node("README.md"),
];

/** A whole-file unified diff (both sides are short): the longest common run of lines stays as
 * context, the rest is removed or added. */
export function lineDiff(before: string[], after: string[]): CodeDiffRow[] {
  const n = before.length, m = after.length;
  const lcs = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) lcs[i]![j] = before[i] === after[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
  const rows: CodeDiffRow[] = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && before[i] === after[j]) { rows.push({ old: i + 1, cur: j + 1, type: "ctx", pieces: [{ text: before[i]! }] }); i++; j++; }
    else if (j < m && (i === n || lcs[i]![j + 1]! >= lcs[i + 1]![j]!)) { rows.push({ old: null, cur: j + 1, type: "add", pieces: [{ text: after[j]! }] }); j++; }
    else { rows.push({ old: i + 1, cur: null, type: "del", pieces: [{ text: before[i]! }] }); i++; }
  }
  return rows;
}

export type Change = { path: string; status: "modified" | "added"; before: string[] };

/** Uncommitted work when the editor opens. */
export const CHANGES: Change[] = [
  { path: "src/routes/invoices.ts", status: "modified", before: invoicesBefore },
  { path: "src/lib/currency.ts", status: "added", before: [] },
];

export type Problem = { value: string; path: string; line: number; col: number; severity: "error" | "warning"; message: string; fixedBy?: "rate-limit" };

export const PROBLEMS: Problem[] = [
  { value: "p1", path: "test/rate-limit.test.ts", line: 19, col: 38, severity: "error", fixedBy: "rate-limit", message: "rate limit › refills the bucket after the window: expected 429 to be 200" },
  { value: "p2", path: "src/routes/invoices.ts", line: 14, col: 9, severity: "warning", message: "'total' is declared but its value is never read. ts(6133)" },
  { value: "p3", path: "src/routes/customers.ts", line: 2, col: 10, severity: "warning", message: "'z' is defined but never used. eslint(no-unused-vars)" },
];

/** What `pnpm test` prints, before and after the fix. */
export function testRun(fixed: boolean): string[] {
  return [
    "$ pnpm test",
    "",
    " RUN  v3.2.4 /home/dev/billing-api",
    "",
    " ✓ test/invoices.test.ts (9 tests) 48ms",
    fixed ? " ✓ test/rate-limit.test.ts (2 tests) 31ms" : " ❯ test/rate-limit.test.ts (2 tests | 1 failed) 29ms",
    ...(fixed ? [] : [
      "   × rate limit > refills the bucket after the window",
      "     → expected 429 to be 200 // Object.is equality",
      "",
      " FAIL  test/rate-limit.test.ts > rate limit > refills the bucket after the window",
      "  ❯ test/rate-limit.test.ts:19:38",
    ]),
    "",
    fixed ? " Test Files  2 passed (2)" : " Test Files  1 failed | 1 passed (2)",
    fixed ? "      Tests  11 passed (11)" : "      Tests  1 failed | 10 passed (11)",
    "   Duration  1.42s",
    "",
  ];
}
