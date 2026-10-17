export const LEADERSHIP_DISTRICT_SWITCH_MARKER = 'BUXORO_LEADERSHIP_DISTRICT_SWITCH_V1';

export function patchLeadershipDistrictSwitch(input: string): string {
  if (!input || input.includes(LEADERSHIP_DISTRICT_SWITCH_MARKER)) return input;

  const helperAnchor = 'function renderUnit(u){';
  const titleAnchor = 'Lp.innerHTML=`<button class="bk" onclick="home()">← Butun viloyat</button><h2>${u.title}</h2>`+';
  const bindAnchor = ' Rp.innerHTML=todayR(u.key==="Kogon"?"Kogon":u.key,l,true);bindRows(Lp);setBig(sum(l,x=>x.vis));';

  if (!input.includes(helperAnchor) || !input.includes(titleAnchor) || !input.includes(bindAnchor)) return input;

  const helper = `\n// ${LEADERSHIP_DISTRICT_SWITCH_MARKER}\nfunction districtSwitchHtml(u){\n return '<div class="district-switch" style="display:flex;gap:6px;overflow-x:auto;padding:4px 0 9px;scrollbar-width:thin">'+UL.map(x=>'<button class="usw-btn" data-u="'+x.key+'" style="white-space:nowrap;border:1px solid '+(x.key===u.key?'#27d8ff':'#18517c')+';background:'+(x.key===u.key?'#0d4d79':'#092943')+';color:#fff;border-radius:9px;padding:7px 9px;cursor:pointer;font-size:11px">'+(x.key==='Kogon'?'Kogon':x.key)+'</button>').join('')+'</div>';\n}\n`;

  let out = input.replace(helperAnchor, helper + helperAnchor);
  out = out.replace(
    titleAnchor,
    'Lp.innerHTML=`<button class="bk" onclick="home()">← Butun viloyat</button><h2>${u.title}</h2>${districtSwitchHtml(u)}`+'
  );
  out = out.replace(
    bindAnchor,
    ' Lp.querySelectorAll(".usw-btn").forEach(b=>b.onclick=()=>{if(b.dataset.u!==cur?.key)selectUnit(b.dataset.u)});' + bindAnchor
  );

  return out;
}
