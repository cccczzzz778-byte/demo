import { createHash, randomBytes, randomUUID } from 'node:crypto';
import postgres from 'postgres';

const nativeServe = Bun.serve.bind(Bun);

function patchLeadershipHtml(input) {
  if (input.includes('BUXORO_SSB_3D_HARDENED_V1')) return input;
  let html = input;
  html = html.replace('</head>', '<meta name="buxoro-ssb-patch" content="BUXORO_SSB_3D_HARDENED_V1"></head>');
  if (!html.includes('const ALLOWED_TYPES=')) {
    html = html.replace('const IDATA=[', 'const ALLOWED_TYPES=new Set(["V","TTB","SHTB","MP","OP","OShP"]);\nconst IDATA=[');
    html = html.replace('];\nconst TY={V:', '].filter(d=>ALLOWED_TYPES.has(d[1]));\nconst TY={V:');
  }
  html = html.replace("const TY={V:[\"DPM\",0xb48cff,0x3a1f7a,1.5,8,1,0],TTB:[\"TTB\",0xffc83d,0x8a5a00,1.5,9,1,1],SHTB:[\"SHTB\",0xff7a3d,0x7a2a00,1.5,11,1,1],MP:[\"MP\",0xff6fb5,0x6a1a40,1.1,6,1,0],OP:[\"OP\",0x35f0a0,0x0a6a40,.9,4,1,0],OShP:[\"OShP\",0x3fa8ff,0x0a3a7a,.8,3,0,0],SES:[\"SES\",0xffffff,0x555555,.7,3.5,0,0],X:[\"Boshqa\",0x9aa8ff,0x2a3a8a,1,5,1,0]};", "const TY={V:[\"DPM\",0xb48cff,0x3a1f7a,1.15,3.6,1,0],TTB:[\"TTB\",0xffc83d,0x8a5a00,1.5,9,1,1],SHTB:[\"SHTB\",0xff7a3d,0x7a2a00,1.5,11,1,1],MP:[\"MP\",0xff6fb5,0x6a1a40,1.1,6,1,0],OP:[\"OP\",0x35f0a0,0x0a6a40,.9,4,1,0],OShP:[\"OShP\",0x3fa8ff,0x0a3a7a,.8,3,0,0]};");
  html = html.replace("const TFULL={V:\"DPM · viloyat darajasidagi muassasa\",TTB:\"Tuman tibbiyot birlashmasi\",SHTB:\"Shahar tibbiyot birlashmasi\",MP:\"Ko'p tarmoqli markaziy poliklinika\",OP:\"Oilaviy poliklinika\",OShP:\"Oilaviy shifokorlik punkti\",SES:\"Sanitariya-epidemiologik osoyishtalik bo'limi\",X:\"Boshqa muassasa\"};", "const TFULL={V:\"DPM · viloyat darajasidagi muassasa\",TTB:\"Tuman tibbiyot birlashmasi\",SHTB:\"Shahar tibbiyot birlashmasi\",MP:\"Ko'p tarmoqli markaziy poliklinika\",OP:\"Oilaviy poliklinika\",OShP:\"Oilaviy shifokorlik punkti\"};");
  html = html.replace('});sc.add(ib);', '});/* white city building layer removed */');
  html = html.replace('});sc.add(ib2);', '});/* white district building layer removed */');
  html = html.replace('const ICS={V:5.8,TTB:5.2,SHTB:5.8,MP:4.4,OP:4.2,OShP:3.8,SES:3.6,X:3.8}', 'const ICS={V:4.0,TTB:5.2,SHTB:5.8,MP:4.4,OP:4.2,OShP:3.8}');
  html = html.replace('const q=new THREE.Mesh(gCone,mat);q.scale.set(t[3]*.9,2.6,t[3]*.9);q.position.set(x,y+t[4],z);sc.add(q);I.fx.push(q);top=t[4]+2.6', 'const q=new THREE.Mesh(gCone,mat);q.scale.set(t[3]*.82,1.1,t[3]*.82);q.position.set(x,y+t[4],z);sc.add(q);I.fx.push(q);top=t[4]+1.1');
  const placementMarker = "Object.values(gp).forEach(g=>{if(g.length>1)g.forEach((p,i)=>{const a=i*6.283/g.length;p.x+=Math.cos(a)*.8;p.z+=Math.sin(a)*.8})});\nP.forEach(p=>tower(p.I,p.x,p.y,p.z));";
  if (!html.includes('function placeDPMInsideBuxoroCity()') && html.includes(placementMarker)) {
    html = html.replace(placementMarker, 'Object.values(gp).forEach(g=>{if(g.length>1)g.forEach((p,i)=>{const a=i*6.283/g.length;p.x+=Math.cos(a)*.8;p.z+=Math.sin(a)*.8})});\n' + "\nfunction safePointInPolygon(p,r,m=.28){\n if(!inP(p,r))return false;\n for(let k=0;k<12;k++){const a=k*Math.PI*2/12;if(!inP([p[0]+Math.cos(a)*m,p[1]+Math.sin(a)*m],r))return false}\n return true\n}\nfunction placeDPMInsideBuxoroCity(){\n const city=DATA.find(d=>d.n===\"Buxoro shahri\");if(!city||!city.r||!city.r[0])return;\n const poly=city.r[0],[x0,x1,y0,y1]=bbox(poly),spacing=.65,cand=[];\n for(let row=0,y=y0+.38;y<=y1-.38;y+=spacing,row++){\n  for(let x=x0+.38+(row%2?spacing/2:0);x<=x1-.38;x+=spacing){if(safePointInPolygon([x,y],poly,.28))cand.push([x,y])}\n }\n cand.sort((a,b)=>Math.hypot(a[0]-city.c[0],a[1]-city.c[1])-Math.hypot(b[0]-city.c[0],b[1]-city.c[1]));\n const dpms=P.filter(p=>p.I.type===\"V\"),ssb=dpms.find(p=>p.I.name===\"Viloyat sog'liqni saqlash boshqarmasi\"),used=[city.c.slice()];\n const setp=(p,q)=>{p.d[4]=q[0];p.d[5]=q[1];p.d[3]=\"Buxoro shahri\";const w=W(q[0],q[1]);p.x=w[0];p.z=w[1];p.y=(parentH[\"Buxoro shahri\"]||H[\"Buxoro\"]||0)+.9};\n if(ssb)setp(ssb,city.c);\n let ci=0;dpms.filter(p=>p!==ssb).forEach(p=>{while(ci<cand.length&&used.some(u=>Math.hypot(cand[ci][0]-u[0],cand[ci][1]-u[1])<=.55))ci++;const q=cand[Math.min(ci,cand.length-1)]||city.c;setp(p,q);used.push(q);ci++});\n}\nplaceDPMInsideBuxoroCity();\n" + 'P.forEach(p=>tower(p.I,p.x,p.y,p.z));');
  }
  const towerMarker = "P.forEach(p=>tower(p.I,p.x,p.y,p.z));\n// flow arcs from Buxoro SHTB to every TTB/SHTB + floating dust";
  if (!html.includes('function buildSSBHeadquarters') && html.includes(towerMarker)) {
    html = html.replace(towerMarker, 'P.forEach(p=>tower(p.I,p.x,p.y,p.z));\n' + "\nfunction buildSSBHeadquarters(){\n const I=INS.find(i=>i.name===\"Viloyat sog'liqni saqlash boshqarmasi\");if(!I)return;\n const old=[I.mesh,...(I.fx||[]),I.ic];old.forEach(o=>{if(o){o.visible=false;sc.remove(o)}});const mi=meshes.indexOf(I.mesh);if(mi>=0)meshes.splice(mi,1);\n const p=P.find(q=>q.I===I),x=p?p.x:I.pos.x,y=p?p.y:0,z=p?p.z:I.pos.z;\n const blue=new THREE.MeshLambertMaterial({color:0x0a67c7,emissive:0x07366d}),white=new THREE.MeshLambertMaterial({color:0xe9f7ff,emissive:0x244a66}),gold=new THREE.MeshLambertMaterial({color:0xffc83d,emissive:0x6a4a00});\n const parts=[];const add=(geo,mat,px,py,pz)=>{const m=new THREE.Mesh(geo,mat);m.position.set(px,py,pz);m.userData={inst:I};sc.add(m);meshes.push(m);parts.push(m);return m};\n add(new THREE.BoxGeometry(6.2,1.0,5.0),blue,x,y+.5,z);\n const body=add(new THREE.BoxGeometry(4.8,4.1,3.8),blue,x,y+3.0,z);\n add(new THREE.BoxGeometry(5.2,.38,4.2),gold,x,y+5.22,z);\n add(new THREE.BoxGeometry(1.0,3.55,.22),white,x,y+3.05,z+2.02);\n add(new THREE.BoxGeometry(2.0,.42,.28),white,x,y+3.2,z+2.18);\n add(new THREE.BoxGeometry(.42,2.0,.28),white,x,y+3.2,z+2.2);\n const ring=new THREE.Mesh(new THREE.RingGeometry(3.6,4.15,48),new THREE.MeshBasicMaterial({color:0x27d8ff,transparent:true,opacity:.72,side:2,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(x,y+.08,z);sc.add(ring);parts.push(ring);\n const lc=document.createElement('canvas');lc.width=lc.height=256;const l=lc.getContext('2d');l.clearRect(0,0,256,256);l.fillStyle='rgba(3,20,55,.94)';l.beginPath();l.arc(128,128,110,0,Math.PI*2);l.fill();l.strokeStyle='#27d8ff';l.lineWidth=10;l.stroke();l.fillStyle='#ffffff';l.fillRect(66,113,124,30);l.fillRect(113,66,30,124);l.fillStyle='#ffc83d';l.font='700 42px sans-serif';l.textAlign='center';l.fillText('SSB',128,232);\n const logo=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(lc),transparent:true,depthWrite:false,fog:false}));logo.userData.b=5.4;logo.position.set(x,y+10.2,z);sc.add(logo);\n const tc=document.createElement('canvas');tc.width=512;tc.height=128;const t=tc.getContext('2d');t.fillStyle='rgba(3,20,55,.92)';t.fillRect(0,20,512,88);t.strokeStyle='#27d8ff';t.lineWidth=4;t.strokeRect(2,22,508,84);t.fillStyle='#ffffff';t.font='700 42px sans-serif';t.textAlign='center';t.textBaseline='middle';t.fillText('BUXORO SSB',256,65);\n const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(tc),transparent:true,depthWrite:false,fog:false}));tag.scale.set(16,4,1);tag.position.set(x,y+7.2,z);sc.add(tag);parts.push(tag);\n I.mesh=body;I.fx=parts.filter(q=>q!==body);I.ic=logo;I.pos=new THREE.Vector3(x,y+5.3,z);I.thr=1e9;\n}\nfunction buildNeighbourhoodHouses(){\n const bodies=[],roofs=[];\n const bodyGeo=new THREE.BoxGeometry(1,1,1);bodyGeo.translate(0,.5,0);const roofGeo=new THREE.ConeGeometry(.72,1,4);roofGeo.rotateY(Math.PI/4);roofGeo.translate(0,.5,0);\n const byName=Object.fromEntries(DATA.map(d=>[d.n,d]));\n P.filter(p=>p.I.type===\"OP\"||p.I.type===\"OShP\").forEach(p=>{\n  if(p.d[4]==null||p.d[5]==null)return;const scope=p.d[3]||p.d[2],area=byName[scope]||byName[p.d[2]],poly=area&&area.r&&area.r[0];if(!poly)return;\n  const wanted=p.I.type===\"OP\"?2:1,base=hs(p.I.name)();let made=0;\n  for(let a=0;a<12&&made<wanted;a++){\n   const ang=(base*6.283)+a*6.283/12,off=p.I.type===\"OP\"?.72:.58,q=[p.d[4]+Math.cos(ang)*off,p.d[5]+Math.sin(ang)*off];if(!safePointInPolygon(q,poly,.16))continue;\n   const w=W(q[0],q[1]);bodies.push([w[0],p.y+.05,w[1],.46,.62,.46]);roofs.push([w[0],p.y+.67,w[1],.52,.30,.52]);made++\n  }\n });\n const bmH=new THREE.MeshLambertMaterial({color:0x1b8fb8,emissive:0x073b52,transparent:true,opacity:.92}),rmH=new THREE.MeshLambertMaterial({color:0x7fe9ff,emissive:0x164a5f,transparent:true,opacity:.95}),m4=new THREE.Matrix4();\n if(bodies.length){const ibH=new THREE.InstancedMesh(bodyGeo,bmH,bodies.length);bodies.forEach((b,i)=>{m4.makeScale(b[3],b[4],b[5]).setPosition(b[0],b[1],b[2]);ibH.setMatrixAt(i,m4)});sc.add(ibH)}\n if(roofs.length){const irH=new THREE.InstancedMesh(roofGeo,rmH,roofs.length);roofs.forEach((b,i)=>{m4.makeScale(b[3],b[4],b[5]).setPosition(b[0],b[1],b[2]);irH.setMatrixAt(i,m4)});sc.add(irH)}\n}\nbuildSSBHeadquarters();\nbuildNeighbourhoodHouses();\n" + '// flow arcs from Buxoro SHTB to every TTB/SHTB + floating dust');
  }
  html = html.replace(/onclick=["']home\(\)["']/g, 'data-home-button="1"');
  if (html.includes('data-home-button="1"') && !html.includes('buxoro-home-handler')) {
    html = html.replace('</script></body>', 'document.querySelectorAll(\'[data-home-button="1"]\').forEach(b=>b.addEventListener(\'click\',home));/* buxoro-home-handler */</script></body>');
  }
  return html;
}

const facilityMain = `<main class="wrap">
  <div class="hero">
    <div>
      <h1 id="cleanFacilityName">Muassasa dashboardi</h1>
      <div class="muted" id="cleanFacilityMeta">Muassasa ma’lumoti yuklanmoqda...</div>
    </div>
    <span class="pill">MUASSASA</span>
  </div>
  <section class="card section">
    <h3>Ma’lumot kiritish</h3>
    <div class="muted" style="font-size:16px;line-height:1.7;padding:18px 0">
      Kiritiladigan ko‘rsatkichlar hozircha belgilanmagan. Buxoro SSB tomonidan aniq ro‘yxat berilgandan keyin ushbu bo‘limda yangi ma’lumot kiritish formasi ochiladi.
    </div>
  </section>
</main>
<script>
api('/api/v1/facility').then(d => {
  const n = document.getElementById('cleanFacilityName');
  const m = document.getElementById('cleanFacilityMeta');
  if (n && d.institution) n.textContent = d.institution.name;
  if (m && d.institution) m.textContent = d.institution.type + ' · ' + d.institution.scope;
}).catch(e => toast(e.message));
</script>`;

const unsafeMethods = new Set(['POST','PUT','PATCH','DELETE']);
const blockedMethods = new Set(['TRACE','CONNECT']);
const rateBuckets = new Map();
const GENERAL_LIMIT = 120;
const SENSITIVE_LIMIT = 12;
const WINDOW_MS = 60_000;
const SENSITIVE_WINDOW_MS = 5 * 60_000;
const JSON_LIMIT = 1_048_576;
const MULTIPART_LIMIT = 30 * 1024 * 1024;
const sensitivePath = /(login|auth|session|password|reset|admin\/users)/i;
const securityDb = Bun.env.DATABASE_URL ? postgres(Bun.env.DATABASE_URL, { max: 2, idle_timeout: 20 }) : null;

if (securityDb) {
  await securityDb`CREATE TABLE IF NOT EXISTS app_security_events (
    id text PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    ip_hash text NOT NULL,
    method text NOT NULL,
    path text NOT NULL,
    action text NOT NULL,
    detail jsonb NOT NULL DEFAULT '{}'::jsonb
  )`;
  await securityDb`CREATE INDEX IF NOT EXISTS app_security_events_created_idx ON app_security_events(created_at DESC)`;
}

function clientIp(request) {
  const direct = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip');
  if (direct) return direct.trim().slice(0,128);
  const xff = request.headers.get('x-forwarded-for');
  if (!xff) return 'unknown';
  const parts = xff.split(',').map(x => x.trim()).filter(Boolean);
  return (parts[parts.length - 1] || 'unknown').slice(0,128);
}
function ipHash(ip) {
  return createHash('sha256').update(`${Bun.env.JWT_SECRET || 'buxoro-ssb'}|${ip}`).digest('hex').slice(0,24);
}
function securityAudit(request, action, detail = {}) {
  const url = new URL(request.url);
  if (!securityDb) return;
  securityDb`INSERT INTO app_security_events ${securityDb({
    id: randomUUID(), ip_hash: ipHash(clientIp(request)), method: request.method,
    path: url.pathname.slice(0,512), action: String(action).slice(0,120), detail
  })}`.catch(() => {});
}
function limited(key, limit, windowMs) {
  const now = Date.now();
  let b = rateBuckets.get(key);
  if (!b || now - b.start >= windowMs) b = { start: now, count: 0 };
  b.count += 1; rateBuckets.set(key, b);
  if (rateBuckets.size > 8000) {
    for (const [k,v] of rateBuckets) if (now - v.start > Math.max(WINDOW_MS,SENSITIVE_WINDOW_MS)) rateBuckets.delete(k);
  }
  return b.count > limit;
}
function reject(status, message, extraHeaders = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', ...extraHeaders }
  });
}
function isSameOriginUnsafe(request, url) {
  if (!unsafeMethods.has(request.method)) return true;
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') return false;
  const origin = request.headers.get('origin');
  if (origin) {
    try { return new URL(origin).origin === url.origin; } catch { return false; }
  }
  const referer = request.headers.get('referer');
  if (referer) {
    try { return new URL(referer).origin === url.origin; } catch { return false; }
  }
  return true;
}
function hardenCookie(cookie) {
  const name = cookie.split('=',1)[0].trim().toLowerCase();
  if (!/(token|session|auth|jwt|sid)/.test(name)) return cookie;
  let out = cookie;
  if (!/;\s*httponly\b/i.test(out)) out += '; HttpOnly';
  if (!/;\s*secure\b/i.test(out)) out += '; Secure';
  if (!/;\s*samesite=/i.test(out)) out += '; SameSite=Strict';
  return out;
}
function addNonce(html, nonce) {
  return html
    .replace(/<script(?![^>]*\bnonce=)/gi, `<script nonce="${nonce}"`)
    .replace(/<style(?![^>]*\bnonce=)/gi, `<style nonce="${nonce}"`);
}
function applySecurityHeaders(response, isHtml, nonce, strictHandlers = false) {
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('server');
  headers.delete('x-powered-by');
  headers.delete('access-control-allow-origin');
  headers.delete('access-control-allow-credentials');
  headers.set('strict-transport-security','max-age=63072000; includeSubDomains');
  headers.set('x-content-type-options','nosniff');
  headers.set('x-frame-options','DENY');
  headers.set('referrer-policy','no-referrer');
  headers.set('permissions-policy','camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), browsing-topics=()');
  headers.set('cross-origin-opener-policy','same-origin');
  headers.set('cross-origin-resource-policy','same-origin');
  headers.set('origin-agent-cluster','?1');
  headers.set('x-robots-tag','noindex, nofollow, noarchive');
  headers.set('cache-control','no-store, private, max-age=0');
  if (isHtml) {
    const attrPolicy = strictHandlers ? "script-src-attr 'none';" : "script-src-attr 'unsafe-inline';";
    headers.set('content-security-policy', [
      "default-src 'self'",
      "base-uri 'none'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      `script-src 'self' 'nonce-${nonce}' https://cdnjs.cloudflare.com`,
      attrPolicy,
      `style-src 'self' 'nonce-${nonce}'`,
      "style-src-attr 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "frame-src 'none'",
      "upgrade-insecure-requests"
    ].join('; '));
  } else {
    headers.set('content-security-policy', "default-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  }
  const getSetCookie = response.headers.getSetCookie?.bind(response.headers);
  const cookies = getSetCookie ? getSetCookie() : (response.headers.get('set-cookie') ? [response.headers.get('set-cookie')] : []);
  if (cookies.length) {
    headers.delete('set-cookie');
    for (const cookie of cookies) if (cookie) headers.append('set-cookie', hardenCookie(cookie));
  }
  return headers;
}

Bun.serve = function patchedServe(options) {
  if (!options || typeof options.fetch !== 'function') return nativeServe(options);
  const originalFetch = options.fetch;
  return nativeServe({
    ...options,
    fetch: async (request, server) => {
      const url = new URL(request.url);
      const ip = clientIp(request);
      const keyBase = `${ip}|${url.pathname}`;

      if (blockedMethods.has(request.method)) {
        securityAudit(request,'blocked_method');
        return reject(405,'Method not allowed',{allow:'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS'});
      }
      if (unsafeMethods.has(request.method) && !isSameOriginUnsafe(request,url)) {
        securityAudit(request,'cross_site_block');
        return reject(403,'Cross-site request blocked');
      }
      if (unsafeMethods.has(request.method)) {
        const sensitive = sensitivePath.test(url.pathname);
        if (limited(`${keyBase}|${sensitive?'s':'g'}`, sensitive ? SENSITIVE_LIMIT : GENERAL_LIMIT, sensitive ? SENSITIVE_WINDOW_MS : WINDOW_MS)) {
          securityAudit(request,'rate_limited',{sensitive});
          return reject(429,'Too many requests',{'retry-after': sensitive ? '300':'60'});
        }
        const rawLen = Number(request.headers.get('content-length') || 0);
        const ct = (request.headers.get('content-type') || '').toLowerCase();
        const max = ct.includes('multipart/form-data') ? MULTIPART_LIMIT : JSON_LIMIT;
        if (rawLen > max) {
          securityAudit(request,'payload_too_large',{bytes:rawLen,max});
          return reject(413,'Payload too large');
        }
      }

      let response;
      try {
        response = await originalFetch(request, server);
      } catch (error) {
        securityAudit(request,'unhandled_server_error');
        return reject(500,'Internal server error');
      }

      if ((response.status === 401 || response.status === 403) && sensitivePath.test(url.pathname)) {
        securityAudit(request,'auth_denied',{status:response.status});
      }

      try {
        const contentType = response.headers.get('content-type') || '';
        const isHtml = contentType.includes('text/html');
        const nonce = randomBytes(18).toString('base64url');
        let body = null;
        let strictHandlers = false;

        if (request.method === 'GET' && response.status >= 200 && response.status < 300 && isHtml) {
          if (url.pathname === '/leadership') {
            body = patchLeadershipHtml(await response.text());
            strictHandlers = true;
          } else {
            body = await response.text();
            if (url.pathname === '/facility') {
              body = body.replace(/<main class="wrap">[\s\S]*?<\/main><script>[\s\S]*?<\/script>/, facilityMain);
            }
          }
          body = addNonce(body, nonce);
        }

        const headers = applySecurityHeaders(response, isHtml, nonce, strictHandlers);
        if (body !== null) return new Response(body,{status:response.status,statusText:response.statusText,headers});
        return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
      } catch {
        return response;
      }
    },
  });
};

await import('./index.ts');
