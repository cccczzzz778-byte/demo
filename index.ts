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
