'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { spawn } = require('node:child_process');

const PORT = Number(process.env.PORT) || 3000;
const UPSTREAM_PORT = 3101;
const PROD = process.env.NODE_ENV === 'production';
const partsDir = path.join(__dirname, 'dashboard_gz');
const encoded = [0, 1, 2].map((i) => fs.readFileSync(path.join(partsDir, `part${i}.b64`), 'utf8').trim()).join('');
const dashboardHtml = zlib.gunzipSync(Buffer.from(encoded, 'base64'));
if (dashboardHtml.length < 80000 || !dashboardHtml.subarray(0, 32).toString('utf8').toLowerCase().includes('<!doctype html>')) {
  throw new Error('3D dashboard fayli tekshiruvdan o‘tmadi.');
}

let stopping = false;
const child = spawn(process.execPath, ['--no-warnings', 'server.js'], {
  cwd: __dirname,
  env: { ...process.env, PORT: String(UPSTREAM_PORT) },
  stdio: 'inherit'
});

function serveDashboard(res) {
  const csp = [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
    "connect-src 'self'",
    "img-src 'self' data:"
  ].join('; ');
  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': String(dashboardHtml.length),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Content-Security-Policy': csp
  };
  if (PROD) headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  res.writeHead(200, headers);
  res.end(dashboardHtml);
}

const server = http.createServer((req, res) => {
  let pathname = '/';
  try { pathname = new URL(req.url, 'http://localhost').pathname; } catch {}
  if (req.method === 'GET' && (pathname === '/' || pathname === '/dashboard' || pathname === '/dashboard.html')) {
    return serveDashboard(res);
  }

  const proxy = http.request({
    hostname: '127.0.0.1',
    port: UPSTREAM_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers }
  }, (upstream) => {
    res.writeHead(upstream.statusCode || 502, upstream.headers);
    upstream.pipe(res);
  });
  proxy.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ error: 'Backend vaqtincha tayyor emas.' }));
  });
  req.pipe(proxy);
});

server.listen(PORT, () => console.log(`3D dashboard gateway ishga tushdi: http://localhost:${PORT}`));
child.on('exit', (code, signal) => {
  if (!stopping) {
    console.error(`Backend to‘xtadi: code=${code} signal=${signal || ''}`);
    process.exit(code || 1);
  }
});

function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  server.close(() => {
    if (!child.killed) child.kill(signal);
  });
  setTimeout(() => {
    if (!child.killed) child.kill('SIGKILL');
    process.exit(1);
  }, 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
