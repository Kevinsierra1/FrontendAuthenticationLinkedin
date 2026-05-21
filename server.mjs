import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd();

loadEnvFile(join(root, ".env"));

const port = Number(process.env.PORT || 4173);
const configuredApiBaseUrl = (
  process.env.VITE_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:5152"
).replace(/\/$/, "");
const backendUrl = configuredApiBaseUrl.endsWith("/api")
  ? configuredApiBaseUrl.slice(0, -4)
  : configuredApiBaseUrl;
const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) return;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    const quoted = (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"));
    if (quoted) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  });
}

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/env.js") {
    const envScript = `window.APP_CONFIG = { ...(window.APP_CONFIG || {}), VITE_API_BASE_URL: ${JSON.stringify(configuredApiBaseUrl)}, NEXT_PUBLIC_API_BASE_URL: ${JSON.stringify(configuredApiBaseUrl)}, VITE_GOOGLE_CLIENT_ID: ${JSON.stringify(googleClientId)}, NEXT_PUBLIC_GOOGLE_CLIENT_ID: ${JSON.stringify(googleClientId)} };`;
    res.writeHead(200, {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "no-store"
    });
    res.end(envScript);
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    try {
      const bodyChunks = [];
      for await (const chunk of req) bodyChunks.push(chunk);
      const body = bodyChunks.length ? Buffer.concat(bodyChunks) : undefined;
      const headers = { ...req.headers };
      delete headers.host;

      const upstream = await fetch(`${backendUrl}${url.pathname}${url.search}`, {
        method: req.method,
        headers,
        body: req.method === "GET" || req.method === "HEAD" ? undefined : body
      });

      res.writeHead(upstream.status, Object.fromEntries(upstream.headers.entries()));
      res.end(Buffer.from(await upstream.arrayBuffer()));
    } catch (error) {
      res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
      res.end(
        JSON.stringify({
          message: "Backend not reachable",
          detail: error?.message || "Unknown proxy error"
        })
      );
    }
    return;
  }

  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = normalize(join(root, requested));

  try {
    const body = await readFile(filePath);
    res.writeHead(200, { "Content-Type": types[extname(filePath)] || "application/octet-stream" });
    res.end(body);
  } catch {
    const body = await readFile(join(root, "index.html"));
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(body);
  }
}).listen(port, () => {
  console.log(`Professional Network running at http://localhost:${port}`);
});
