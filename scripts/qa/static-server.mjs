// A tiny static file server for a built docs site: node scripts/qa/static-server.mjs <dir> <port>
// Used by docs.mjs's budget step, so the measured build never touches apps/docs/dist (which the
// preview on :4323 serves) and needs no `astro preview` (one per project).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const [dir, port] = [path.resolve(process.argv[2]), Number(process.argv[3] || 4322)];
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".woff": "font/woff", ".txt": "text/plain; charset=utf-8", ".md": "text/markdown; charset=utf-8", ".ico": "image/x-icon", ".webp": "image/webp" };
http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || "/").split("?")[0]);
  let file = path.join(dir, p);
  if (!file.startsWith(dir)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  else if (!fs.existsSync(file) && fs.existsSync(file + ".html")) file += ".html";
  else if (!fs.existsSync(file) && fs.existsSync(path.join(file, "index.html"))) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) { res.writeHead(404, { "content-type": "text/plain" }).end("not found"); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(port, "127.0.0.1");
