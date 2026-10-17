export const LEADERSHIP_DISTRICT_DASHBOARD_STYLE_MARKER = 'BUXORO_LEADERSHIP_DISTRICT_DASHBOARD_STYLE_V1';

export function patchLeadershipDistrictDashboardStyle(input: string): string {
  if (!input || input.includes(LEADERSHIP_DISTRICT_DASHBOARD_STYLE_MARKER)) return input;

  const styleAnchor = '</style>';
  const homeAnchor = 'function home(){';
  const selectAnchor = 'function selectUnit(key){';
  const renderUnitAnchor = 'Lp.innerHTML=`<button class="bk" onclick="home()">← Butun viloyat</button><h2>${u.title}</h2>`+(hq?`<div class="bd" style="color:#ffc83d">${hq.name}</div>`:"")+';

  if (!input.includes(styleAnchor) || !input.includes(homeAnchor) || !input.includes(selectAnchor) || !input.includes(renderUnitAnchor)) return input;

  const css = `
/* ${LEADERSHIP_DISTRICT_DASHBOARD_STYLE_MARKER} */
body.district-mode #L,body.district-mode #R{
  background:linear-gradient(165deg,rgba(7,31,69,.94),rgba(2,17,43,.92));
  border:1px solid rgba(68,220,255,.42);
  border-radius:18px;
  box-shadow:0 18px 55px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.05),inset 0 0 38px rgba(39,216,255,.08);
  backdrop-filter:blur(13px) saturate(130%);
  padding:15px 16px;
}
body.district-mode #L{width:350px}
body.district-mode #R{width:342px}
body.district-mode .p:before,body.district-mode .p:after{display:none}
body.district-mode .district-head{
  position:relative;
  margin:0 0 12px;
  padding:12px 13px 11px;
  border:1px solid rgba(39,216,255,.25);
  border-radius:14px;
  background:linear-gradient(135deg,rgba(39,216,255,.13),rgba(11,74,143,.12));
  overflow:hidden;
}
body.district-mode .district-head:after{
  content:"";position:absolute;right:-28px;top:-35px;width:110px;height:110px;border-radius:50%;
  background:radial-gradient(circle,rgba(39,216,255,.18),transparent 67%);pointer-events:none
}
body.district-mode .district-kicker{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#ffc83d;margin-bottom:4px;font-weight:700}
body.district-mode .district-head h2{margin:0 0 5px;font-size:20px;line-height:1.1;color:#fff;text-shadow:0 0 14px rgba(39,216,255,.35)}
body.district-mode .district-head .bd{margin:0;color:#9beeff!important;font-size:11px;font-weight:600}
body.district-mode .bk{
  border-radius:10px;margin-bottom:10px;padding:7px 11px;border-color:rgba(39,216,255,.42);
  background:rgba(7,43,78,.72);transition:.18s ease
}
body.district-mode .bk:hover{transform:translateY(-1px);background:rgba(39,216,255,.18)}
body.district-mode .p h2{margin-top:12px;margin-bottom:7px;font-size:12px;letter-spacing:.45px;color:#88ecff;text-transform:uppercase}
body.district-mode .g{gap:8px}
body.district-mode .g div{
  min-height:61px;border:1px solid rgba(39,216,255,.17);border-left:3px solid #27d8ff;border-radius:11px;
  padding:8px 10px;background:linear-gradient(145deg,rgba(4,31,72,.9),rgba(1,19,48,.74));
  box-shadow:inset 0 0 16px rgba(39,216,255,.035);transition:.18s ease
}
body.district-mode .g div:hover{transform:translateY(-1px);border-color:rgba(39,216,255,.4);box-shadow:0 7px 18px rgba(0,0,0,.16)}
body.district-mode .g b{font-size:25px;line-height:1;color:#ffc83d;text-shadow:0 0 10px rgba(255,200,61,.14)}
body.district-mode .g span{display:block;margin-top:5px;color:#d6efff;font-size:11px;line-height:1.2;opacity:.9}
body.district-mode #big{
  margin:3px 0 9px;font-size:46px;line-height:1;
  background:linear-gradient(180deg,#fff,#91eaff);-webkit-background-clip:text;background-clip:text;color:transparent;
  text-shadow:none;filter:drop-shadow(0 0 10px rgba(39,216,255,.28))
}
body.district-mode #big small{color:#ffc83d;-webkit-text-fill-color:#ffc83d;font-size:12px}
body.district-mode #q{
  border-radius:10px;padding:8px 10px;background:rgba(2,21,51,.78);border-color:rgba(39,216,255,.32);
  outline:none;transition:.18s ease
}
body.district-mode #q:focus{border-color:#27d8ff;box-shadow:0 0 0 3px rgba(39,216,255,.10)}
body.district-mode .rk{display:flex;flex-direction:column;gap:5px}
body.district-mode .rk div{
  display:grid;grid-template-columns:18px 1fr 58px;margin:0;padding:6px 7px;border-radius:8px;
  border:1px solid rgba(39,216,255,.09);background:rgba(1,18,44,.45)
}
body.district-mode .rk div:hover{background:rgba(39,216,255,.12);border-color:rgba(39,216,255,.28)}
body.district-mode .chips button{
  border-radius:999px;padding:6px 12px;background:rgba(4,29,65,.9);border-color:rgba(39,216,255,.32);
  box-shadow:0 5px 16px rgba(0,0,0,.17);transition:.18s ease
}
body.district-mode .chips button:hover{transform:translateY(-1px);border-color:#27d8ff}
body.district-mode #R svg{filter:drop-shadow(0 5px 8px rgba(0,0,0,.14))}
body.district-mode #L::-webkit-scrollbar,body.district-mode #R::-webkit-scrollbar{width:7px;height:7px}
body.district-mode #L::-webkit-scrollbar-thumb,body.district-mode #R::-webkit-scrollbar-thumb{background:rgba(39,216,255,.28);border-radius:10px}
@media(max-width:900px){body.district-mode #L,body.district-mode #R{width:auto;border-radius:13px;padding:10px 11px}body.district-mode .district-head{padding:9px 10px}body.district-mode .district-head h2{font-size:17px}}
`;

  let out = input.replace(styleAnchor, css + styleAnchor);
  out = out.replace(homeAnchor, 'function home(){document.body.classList.remove("district-mode");');
  out = out.replace(selectAnchor, 'function selectUnit(key){document.body.classList.add("district-mode");');
  out = out.replace(
    renderUnitAnchor,
    'Lp.innerHTML=`<button class="bk" onclick="home()">← Butun viloyat</button><div class="district-head"><div class="district-kicker">Hudud dashboardi</div><h2>${u.title}</h2>${hq?`<div class="bd">${hq.name}</div>`:""}</div>`+'
  );
  return out;
}
