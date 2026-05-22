import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd();

loadEnvFile(join(root, ".env"));

const port = Number(process.env.PORT || 4173);
const backendUrl = (
  process.env.VITE_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:5152"
).replace(/\/$/, "");
const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const microsoftClientId =
  process.env.VITE_MICROSOFT_CLIENT_ID || process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || "";

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
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

async function readStaticAsset(requestedPath) {
  const relativePath = requestedPath.replace(/^\//, "");
  const rootDir = normalize(root);
  const candidates = [
    join(rootDir, relativePath),
    join(rootDir, "public", relativePath)
  ];

  for (const filePath of candidates) {
    const normalizedPath = normalize(filePath);
    if (!normalizedPath.startsWith(rootDir)) continue;
    try {
      return await readFile(normalizedPath);
    } catch {
      // Try next location.
    }
  }

  throw new Error("Asset not found");
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/env.js") {
    const apiBaseUrl = (process.env.VITE_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
    const backendPublicUrl = (process.env.VITE_BACKEND_URL || process.env.BACKEND_URL || backendUrl).replace(/\/$/, "");
    const envScript = `window.APP_CONFIG = { ...(window.APP_CONFIG || {}), VITE_API_BASE_URL: ${JSON.stringify(apiBaseUrl)}, NEXT_PUBLIC_API_BASE_URL: ${JSON.stringify(apiBaseUrl)}, VITE_BACKEND_URL: ${JSON.stringify(backendPublicUrl)}, NEXT_PUBLIC_BACKEND_URL: ${JSON.stringify(backendPublicUrl)}, VITE_GOOGLE_CLIENT_ID: ${JSON.stringify(googleClientId)}, NEXT_PUBLIC_GOOGLE_CLIENT_ID: ${JSON.stringify(googleClientId)}, VITE_MICROSOFT_CLIENT_ID: ${JSON.stringify(microsoftClientId)}, NEXT_PUBLIC_MICROSOFT_CLIENT_ID: ${JSON.stringify(microsoftClientId)} };`;
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
  const filePath = normalize(join(root, requested.replace(/^\//, "")));

  try {
    const body = await readStaticAsset(requested);
    res.writeHead(200, {
      "Content-Type": types[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(body);
  } catch {
    const body = await readFile(join(root, "index.html"));
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    });
    res.end(body);
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Puerto ${port} en uso. Cierra el otro servidor (pnpm dev) o ejecuta: taskkill //PID <pid> //F`
    );
    process.exit(1);
  }
  throw error;
});

server.listen(port, () => {
  console.log(`Professional Network running at http://localhost:${port}`);
});
