const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "buxoro-ssb-demo-portal" });
});

const USERNAME = process.env.DEMO_USERNAME || "admin";
const PASSWORD = process.env.DEMO_PASSWORD || "BuxoroPilot2026!";

app.use((req, res, next) => {
  if (req.path === "/api/health") return next();

  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Basic ")) {
    res.set("WWW-Authenticate", 'Basic realm="Buxoro SSB Pilot"');
    return res.status(401).send("Kirish talab qilinadi");
  }

  const raw = Buffer.from(auth.slice(6), "base64").toString("utf8");
  const separator = raw.indexOf(":");
  const username = separator >= 0 ? raw.slice(0, separator) : "";
  const password = separator >= 0 ? raw.slice(separator + 1) : "";

  if (username !== USERNAME || password !== PASSWORD) {
    res.set("WWW-Authenticate", 'Basic realm="Buxoro SSB Pilot"');
    return res.status(401).send("Login yoki parol noto'g'ri");
  }

  next();
});

app.use(express.static(path.join(__dirname, "public")));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Buxoro SSB Demo portal running on port ${PORT}`);
});
