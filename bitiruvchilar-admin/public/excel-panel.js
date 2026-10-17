'use strict';
(()=>{
 const $=s=>document.querySelector(s),fmt=n=>String(Math.round(Number(n)||0)).replace(/\B(?=(\d{3})+(?!\d))/g,' '),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let ME=null,page=0,limit=200,total=0,lastRows=[];
 async function api(url,opt){const r=await fetch(url,opt);const j=await r.json().catch(()=>({}));if(r.status===401){location.href='/login';throw new Error('Login talab qilinadi.')}if(!r.ok)throw new Error(j.error||'Xatolik');return j}
 const norm=s=>String(s??'').toLowerCase().replace(/[ʻʼ’‘`']/g,'').replace(/ё/g,'е').replace(/ў/g,'у').replace(/қ/g,'к').replace(/ғ/g,'г').replace(/ҳ/g,'х').replace(/[^a-zа-я0-9]+/gi,' ').trim();
 const n=v=>Number(v)||0;
 function statusOf(c){
  const labels=[[13,'Davlat korxonasida ishlaydi'],[14,'Xususiy korxonada ishlaydi'],[15,'Huquqni muhofaza qilish organlarida'],[16,'Tadbirkor'],[17,'Kredit olgan'],[18,'Taʼlimning keyingi bosqichida'],[19,'Migratsiyada'],[20,'O‘zini-o‘zi band qilgan'],[21,'Kasb-hunarga o‘qitilgan'],[22,'2 yoshgacha bola tarbiyasida']];
  for(const [i,l] of labels)if(n(c[i])>0)return l;
  if(n(c[23])>0)return 'Ishsiz';
  if(n(c[12])>0)return 'Band';
  if(n(c[24])>0)return 'Band qilish rejasida';
  return 'Aniqlanmagan';
 }
 function mapOp(map,hud,mah){const nh=norm(hud),nm=norm(mah);for(const [k,v] of Object.entries(map)){const p=k.split('|');if(norm(p[0])===nh&&norm(p.slice(1).join('|'))===nm)return v}return ''}
 async function init(){
  const me=await api('/api/me');ME=me.user;$('#who').textContent=(ME.fio||ME.login)+' · '+(ME.role==='admin'?'Administrator':'Operator');if(ME.role!=='admin')$('#import-card').classList.add('hidden');
  $('#logout').onclick=async()=>{await fetch('/api/logout',{method:'POST'});location.href='/login'};
  $('#q').oninput=debounce(()=>{page=0;loadRows()},250);['#hudud','#op','#holat'].forEach(s=>$(s).onchange=()=>{page=0;loadRows()});$('#clear').onclick=()=>{['#q','#hudud','#op','#holat'].forEach(s=>$(s).value='');page=0;loadRows()};
  $('#prev').onclick=()=>{if(page>0){page--;loadRows()}};$('#next').onclick=()=>{if((page+1)*limit<total){page++;loadRows()}};$('#csv').onclick=downloadCsv;$('#import').onclick=doImport;
  await loadSummary();await loadRows();
 }
 function debounce(fn,ms){let t;return()=>{clearTimeout(t);t=setTimeout(fn,ms)}}
 async function loadSummary(){const s=await api('/api/public/excel-summary');$('#s-total').textContent=fmt(s.total);$('#s-mapped').textContent=fmt(s.mapped);$('#s-unmapped').textContent=fmt(Math.max(0,s.total-s.mapped));$('#s-fac').textContent=fmt(s.facilities)}
 async function loadRows(){
  const p=new URLSearchParams({limit:String(limit),offset:String(page*limit)});const q=$('#q').value.trim(),h=$('#hudud').value,op=$('#op').value,hol=$('#holat').value;if(q)p.set('q',q);if(h)p.set('hudud',h);if(op)p.set('op',op);if(hol)p.set('holat',hol);
  const j=await api('/api/excel/graduates?'+p);total=j.total||0;lastRows=j.records||[];render();
 }
 function render(){
  $('#tb').innerHTML=lastRows.map((r,i)=>`<tr><td>${page*limit+i+1}</td><td class="wrap">${esc(r.fio)}</td><td>${esc(r.hudud||'—')}</td><td class="wrap">${esc(r.mahalla||'—')}</td><td class="wrap">${r.op_oshp?esc(r.op_oshp):'<span class="warn">Aniqlanmagan</span>'}</td><td class="hide-sm">${esc(r.toifa||'—')}</td><td class="hide-sm">${esc(r.holat||'—')}</td></tr>`).join('');
  $('#count').textContent=`Jami: ${fmt(total)} ta · ${total?fmt(page*limit+1):0}–${fmt(Math.min((page+1)*limit,total))}`;$('#prev').disabled=page===0;$('#next').disabled=(page+1)*limit>=total;
  fill('#hudud',lastRows.map(r=>r.hudud),'Barcha hududlar');fill('#op',lastRows.map(r=>r.op_oshp).filter(Boolean),'Barcha OP/OShP',true);fill('#holat',lastRows.map(r=>r.holat).filter(Boolean),'Barcha bandlik holatlari');
 }
 function fill(sel,arr,label,unmapped=false){const s=$(sel),v=s.value,vals=[...new Set(arr.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'uz'));s.innerHTML=`<option value="">${label}</option>${unmapped?'<option value="__unmapped">Aniqlanmagan</option>':''}`+vals.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');if([...s.options].some(o=>o.value===v))s.value=v}
 async function doImport(){
  const f=$('#file').files[0],msg=$('#imsg');if(!f){msg.textContent='Excel faylni tanlang.';msg.className='msg warn';return}if(!window.XLSX){msg.textContent='Excel moduli yuklanmadi. Internetni tekshiring.';msg.className='msg bad';return}
  msg.textContent='Excel o‘qilmoqda…';msg.className='msg';$('#import').disabled=true;
  try{
   const wb=XLSX.read(await f.arrayBuffer(),{type:'array',cellDates:true});const sn=wb.SheetNames.find(x=>norm(x).includes('руйхат')||norm(x).includes('royxat'))||wb.SheetNames[wb.SheetNames.length-1];const a=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,defval:'',raw:true});const map=await api('/op-map.json');const out=[];
   for(let i=5;i<a.length;i++){const c=a[i]||[],fio=String(c[3]||'').trim();if(fio.length<5)continue;const hud=String(c[1]||'').trim(),mah=String(c[9]||'').trim(),toifa=String(c[10]||'').trim(),holat=statusOf(c),op=mapOp(map,hud,mah);out.push({fio,hudud:hud,mahalla:mah,toifa,holat,op_oshp:op})}
   if(out.length<9700||out.length>9900)throw new Error(`Excel ichidan ${out.length} ta bitiruvchi topildi. Kutilgan miqdor 9 823 ga yaqin bo‘lishi kerak.`);
   msg.textContent=`${fmt(out.length)} ta yozuv bazaga yuborilmoqda…`;
   const j=await api('/api/excel/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rows:out})});msg.textContent=`Tayyor: ${fmt(j.ok)} ta. OP/OShP aniq: ${fmt(j.mapped)}, aniqlanmagan: ${fmt(j.unmapped)}.`;msg.className='msg ok';page=0;await loadSummary();await loadRows();
  }catch(e){msg.textContent=e.message;msg.className='msg bad'}finally{$('#import').disabled=false}
 }
 function downloadCsv(){if(!lastRows.length)return;const rows=[['F.I.O.','Hudud','Mahalla','OP/OShP','Bitiruvchi turi','Bandlik holati'],...lastRows.map(r=>[r.fio,r.hudud,r.mahalla,r.op_oshp,r.toifa,r.holat])];const csv='\ufeff'+rows.map(r=>r.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');const b=new Blob([csv],{type:'text/csv;charset=utf-8'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='bitiruvchilar_'+(page+1)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
 init().catch(e=>{document.body.innerHTML='<div style="padding:30px;color:#ffb3b3">'+esc(e.message)+'</div>'});
})();