import { readFileSync } from "node:fs";
import { brotliDecompressSync } from "node:zlib";
import { createHash, createHmac, timingSafeEqual, randomBytes, scryptSync, randomUUID } from "node:crypto";
import postgres from "postgres";

const encoded = Array.from({ length: 7 }, (_, i) =>
  readFileSync(new URL(`./parts/${i}.txt`, import.meta.url), "utf8").trim()
).join("");

const checksum = createHash("sha256").update(encoded).digest("hex");
if (checksum !== "734d54c2514214432ad836d0373495bbcf3c6c80f475d0f1f33326f746c45f2e") {
  throw new Error(`Dashboard source checksum mismatch: ${checksum}`);
}

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
  Bun,
  process,
  Buffer,
  Response,
  URL
);
