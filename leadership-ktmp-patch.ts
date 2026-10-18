export const LEADERSHIP_KTMP_MARKER='BUXORO_LEADERSHIP_KTMP_V2';

export function patchLeadershipKTMP(input:string):string{
  if(!input||input.includes(LEADERSHIP_KTMP_MARKER)) return input;
  let out=input;

  // The uploaded source stores central polyclinics as MP. Promote them to KTMP
  // before SHOWT/IDATA are evaluated so they become real map institutions.
  out=out.replaceAll(',"MP",',',"KTMP",');

  out=out.replace(
    /const SHOWT=\{([^}]+)\};/,
    (m,inner)=>inner.includes('KTMP:')?m:`const SHOWT={${inner.replace('OP:1','KTMP:1,OP:1')}};`
  );

  out=out.replace(
    /const TY=\{([^;]+)\};/,
    (m,inner)=>inner.includes('KTMP:[')?m:`const TY={${inner.replace('OP:["OP"','KTMP:["KTMP",0x2dd4ff,0x0b5d73,1.35,7.2,1,1],OP:["OP"')}};`
  );

  out=out.replace(
    /const TFULL=\{([^;]+)\};/,
    (m,inner)=>inner.includes('KTMP:')?m:`const TFULL={${inner.replace('OP:"Oilaviy poliklinika"','KTMP:"Ko‘p tarmoqli markaziy poliklinika",OP:"Oilaviy poliklinika"')}};`
  );

  out=out.replace(
    /const ICS=\{([^}]+)\},ICT=\{\};/,
    (m,inner)=>inner.includes('KTMP:')?m:`const ICS={${inner.replace('OP:4.4','KTMP:5.4,OP:4.4').replace('OP:4.2','KTMP:5.4,OP:4.2')}},ICT={};`
  );

  // KTMP is a major outpatient institution: size/data generation should not
  // fall through to the tiny OShP defaults.
  out=out.replace(
    'big=type==="TTB"||type==="SHTB"',
    'big=type==="TTB"||type==="SHTB"||type==="KTMP"'
  );

  // Give KTMP an explicit, clearly visible hospital-style icon.
  out=out.replace(
    'else if(type==="OP"){rr(8,8,80,80,16);x.fill();x.stroke();x.beginPath();',
    'else if(type==="KTMP"){rr(8,8,80,80,16);x.fill();x.stroke();x.lineWidth=4;x.strokeStyle="#ffffff";x.strokeRect(20,20,56,56);cross(48,48,30,10,"#ffffff")}\n else if(type==="OP"){rr(8,8,80,80,16);x.fill();x.stroke();x.beginPath();'
  );

  // Placement priority must be numeric for every type. Previously KTMP was
  // undefined here, so its placement order was unstable in dense districts.
  out=out.replace(
    'const PR={SHTB:0,TTB:0,V:1,OP:2,OShP:3}',
    'const PR={SHTB:0,TTB:0,KTMP:1,V:2,OP:3,OShP:4}'
  );

  // Make a KTMP settlement/facility cluster visibly larger than OP/OShP.
  out=out.replace(
    'ty==="TTB"||ty==="SHTB"?48:ty==="OP"?22:ty==="OShP"?13:',
    'ty==="TTB"||ty==="SHTB"?48:ty==="KTMP"?32:ty==="OP"?22:ty==="OShP"?13:'
  );

  out=out.replace(
    "const dccLegend=(u)=>{const types=[['TTB','🟨'],['SHTB','🟧'],['OP','✚'],['OShP','✚']]",
    "const dccLegend=(u)=>{const types=[['TTB','🟨'],['SHTB','🟧'],['KTMP','✚'],['OP','✚'],['OShP','✚']]"
  );

  return out+`\n<!-- ${LEADERSHIP_KTMP_MARKER} -->`;
}
