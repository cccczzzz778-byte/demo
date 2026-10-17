const nativeServe = Bun.serve.bind(Bun);

function patchLeadershipUx(input: string) {
  if (!input || input.includes('BUXORO_SSB_DISTRICT_UX_V1')) return input;
  let html = input;

  const css = `<style id="buxoro-district-ux-style">
.todaybx{margin:0 0 10px;padding:10px 11px;border:1px solid rgba(39,216,255,.45);background:linear-gradient(135deg,rgba(8,46,92,.94),rgba(4,25,58,.94));box-shadow:0 0 24px rgba(39,216,255,.10);border-radius:8px}
.todayttl{display:flex;align-items:center;justify-content:space-between;color:#eafaff;font-weight:800;font-size:14px;margin-bottom:8px}.todayttl b{color:#27d8ff;font-size:11px;letter-spacing:.08em}
.todaygrid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.todaystat{background:rgba(5,31,69,.78);border-left:2px solid #27d8ff;padding:7px 8px}.todaystat strong{display:block;color:#fff;font-size:17px;line-height:1.05}.todaystat span{display:block;color:#9ccfe6;font-size:10px;margin-top:3px}.todaynote{margin-top:7px;color:#ffc83d;font-size:10px;line-height:1.35}
</style><meta name="buxoro-district-ux" content="BUXORO_SSB_DISTRICT_UX_V1">`;
  html = html.replace('</head>', css + '</head>');

  const colorPrelude = `const DISTRICT_COLORS={
"Buxoro":0x398cff,"Buxoro shahri":0x20d9ff,"Kogon":0x8f6bff,"Kogon shahri":0xffc247,
"Olot":0x24c7b1,"Qorako'l":0x536dfe,"Jondor":0x28cfa2,"Peshku":0x55b8ff,
"Vobkent":0xe7d44e,"G'ijduvon":0xd666e8,"Shofirkon":0xff9655,"Romitan":0xa67cff,"Qorovulbozor":0xff6f7d};
const districtScore=n=>VAL[n]??(n==="Buxoro shahri"?VAL["Buxoro"]:n==="Kogon shahri"?VAL["Kogon"]:null);
function districtStatusColor(n){const v=districtScore(n);return v==null?0x27d8ff:v>=75?0x25e06a:v>=55?0xffc83d:0xff5b6e}
`;
  html = html.replace('const c1=new THREE.Color(0x0b4a8f),c2=new THREE.Color(0x27d8ff),meshes=[],lbs=[],cities=[],dists=[],MT={},rings=[];', colorPrelude + 'const c1=new THREE.Color(0x0b4a8f),c2=new THREE.Color(0x27d8ff),meshes=[],lbs=[],cities=[],dists=[],MT={},rings=[];');
  html = html.replace('const col=city?new THREE.Color(0x8aeeff):c1.clone().lerp(c2,(VAL[d.n]-35)/60);', 'const col=new THREE.Color(DISTRICT_COLORS[d.n]||0x147bd1);');
  html = html.replace('ribbon(lp,h,city?5:3.2,city?0xffffff:0x27d8ff);', 'ribbon(lp,h,city?5:3.2,districtStatusColor(d.n));');

  const focusCode = `function applyDistrictFocus(n){
 Object.entries(MT).forEach(([k,mm])=>{const active=!n||k===n;mm.forEach(m=>{m.transparent=!!n;m.opacity=active?1:.22;if(m.emissive){if(n&&active)m.emissive.copy(m.color).multiplyScalar(.14);else m.emissive.setHex(0)}m.needsUpdate=true})});
}
`;
  html = html.replace('// buildings', focusCode + '// buildings');

  const todayCode = `function todayBox(title,list){
 const province=list===INS,hudud=province?DATA.length:(list.length?1:0),scope=title||"Buxoro viloyati";
 return '<div class="todaybx"><div class="todayttl"><span>Bugungi holat</span><b>JONLI NAZORAT</b></div><div class="todaygrid"><div class="todaystat"><strong>'+list.length+'</strong><span>Muassasa · '+scope+'</span></div><div class="todaystat"><strong>'+hudud+'</strong><span>Hudud ko‘rinmoqda</span></div></div><div class="todaynote">Ko‘rsatkichlar ro‘yxati siz tasdiqlagandan keyin shu blokda avtomatik hisoblanadi.</div></div>';
}
`;
  html = html.replace('function render(title,list,I){', todayCode + 'function render(title,list,I){');
  html = html.replace('Lp.innerHTML=l;Rp.innerHTML=r;', 'Lp.innerHTML=todayBox(title,list)+l;Rp.innerHTML=r;');
  html = html.replace('function home(){tgG.set(0,0,0);rdG=270;phG=1;fly=true;selLab.hide=true;render("Buxoro viloyati",INS)}', 'function home(){applyDistrictFocus(null);tgG.set(0,0,0);rdG=270;phG=1;fly=true;selLab.hide=true;render("Buxoro viloyati",INS)}');
  html = html.replace('function selectDist(n){const t=INS.find(x=>(x.type==="TTB"||x.type==="SHTB")&&x.dist===n)||INS.find(x=>x.dist===n);if(!t)return;selLab.hide=true;tgG.set(t.pos.x,0,t.pos.z);rdG=110;phG=.9;fly=true;render(n.endsWith("shahri")?n:n+" tumani",INS.filter(x=>x.dist===n))}', 'function selectDist(n){const t=INS.find(x=>(x.type==="TTB"||x.type==="SHTB")&&x.dist===n)||INS.find(x=>x.dist===n);if(!t)return;applyDistrictFocus(n);selLab.hide=true;tgG.set(t.pos.x,0,t.pos.z);rdG=110;phG=.9;fly=true;render(n.endsWith("shahri")?n:n+" tumani",INS.filter(x=>x.dist===n))}');
  html = html.replace('function selectInst(I){selLab.d.textContent=I.name;selLab.v.set(I.pos.x,I.pos.y+14,I.pos.z);selLab.hide=false;tgG.set(I.pos.x,0,I.pos.z);rdG=45;phG=.8;fly=true;render(I.name,[I],I)}', 'function selectInst(I){applyDistrictFocus(I.dist);selLab.d.textContent=I.name;selLab.v.set(I.pos.x,I.pos.y+14,I.pos.z);selLab.hide=false;tgG.set(I.pos.x,0,I.pos.z);rdG=45;phG=.8;fly=true;render(I.name,[I],I)}');
  return html;
}

Bun.serve = function districtUxServe(options: any) {
  if (!options || typeof options.fetch !== 'function') return nativeServe(options);
  const innerFetch = options.fetch;
  return nativeServe({
    ...options,
    fetch: async (request: Request, server: any) => {
      const response = await innerFetch(request, server);
      try {
        const pathname = new URL(request.url).pathname;
        const contentType = response?.headers?.get?.('content-type') || '';
        if (pathname === '/leadership' && response instanceof Response && contentType.includes('text/html')) {
          const source = await response.text();
          const headers = new Headers(response.headers);
          headers.delete('content-length');
          headers.set('cache-control', 'no-store');
          return new Response(patchLeadershipUx(source), {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
        }
      } catch (e) {
        console.error('DISTRICT_UX_PATCH_FAILED', e instanceof Error ? e.message : String(e));
      }
      return response;
    },
  });
};

await import('./mobile-wrapper.ts');
