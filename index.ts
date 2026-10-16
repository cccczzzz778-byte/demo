import { readFileSync } from "node:fs";
import { brotliDecompressSync } from "node:zlib";
import { createHash, createHmac, timingSafeEqual, randomBytes, scryptSync, randomUUID } from "node:crypto";
import postgres from "postgres";

const encoded = Array.from({ length: 7 }, (_, i) =>
  readFileSync(new URL(`./parts/${i}.txt`, import.meta.url), "utf8").trim()
).join("");

const checksum = createHash("sha256").update(encoded).digest("hex");
if (checksum !== "d89b73523d52adc8ddead59b2b2c83db79d3817544dad8dac5b791a9c9d93235") {
  throw new Error(`Dashboard source checksum mismatch: ${checksum}`);
}

const earlyApiScript = `<script>
async function api(path, options={}) {
  const init = { credentials: "same-origin", ...options };
  init.headers = { ...(options.body ? {"content-type":"application/json"} : {}), ...(options.headers || {}) };
  const res = await fetch(path, init);
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data.error || data.message || ("HTTP " + res.status));
  return data;
}
</script>`;

const shellPaths = new Set(["/admin", "/leadership", "/region", "/facility"]);
const BunProxy = Object.create(Bun);
BunProxy.serve = function(options) {
  if (!options || typeof options.fetch !== "function") return Bun.serve(options);
  const originalFetch = options.fetch;
  return Bun.serve({
    ...options,
    fetch: async (request, server) => {
      const response = await originalFetch(request, server);
      try {
        const url = new URL(request.url);
        const contentType = response.headers.get("content-type") || "";
        if (!shellPaths.has(url.pathname) || !contentType.includes("text/html")) return response;
        const html = await response.text();
        const patched = html.replace("</head>", earlyApiScript + "</head>");
        const headers = new Headers(response.headers);
        headers.delete("content-length");
        return new Response(patched, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      } catch {
        return response;
      }
    },
  });
};

const source = brotliDecompressSync(Buffer.from(encoded, "base64")).toString("utf8");
await Function(
  "postgres",
  "createHash",
  "createHmac",
  "timingSafeEqual",
  "randomBytes",
  "scryptSync",
  "randomUUID",
  "brotliDecompressSync",
  "Bun",
  "process",
  "Buffer",
  "Response",
  "URL",
  `return (async()=>{${source}})()`
)(
  postgres,
  createHash,
  createHmac,
  timingSafeEqual,
  randomBytes,
  scryptSync,
  randomUUID,
  brotliDecompressSync,
  BunProxy,
  process,
  Buffer,
  Response,
  URL
);
