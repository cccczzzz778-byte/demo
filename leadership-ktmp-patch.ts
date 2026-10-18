export const LEADERSHIP_KTMP_MARKER='BUXORO_LEADERSHIP_KTMP_V1';

export function patchLeadershipKTMP(input:string):string{
  if(!input||input.includes(LEADERSHIP_KTMP_MARKER)) return input;
  let out=input;

  // Existing source stores central multidisciplinary polyclinics as MP.
  // Promote them to the explicit KTMP type used by the dashboard UI.
  out=out.replaceAll(',"MP",',',"KTMP",');

  out=out.replace(
    'const SHOWT={V:1,TTB:1,SHTB:1,OP:1,OShP:1};',
    'const SHOWT={V:1,TTB:1,SHTB:1,KTMP:1,OP:1,OShP:1};'
  );

  out=out.replace(
    /const TY=\{V:\[[^;]+OShP:\[[^;]+\};/,
    m=>m.includes('KTMP:[')?m:m.replace('OP:["OP"','KTMP:["KTMP",0x2dd4ff,0x0b5d73,1.1,5.2,1,0],OP:["OP"')
  );

  out=out.replace(
    /const TFULL=\{([^;]+)\};/,
    (m,inner)=>inner.includes('KTMP:')?m:`const TFULL={${inner.replace('OP:"Oilaviy poliklinika"','KTMP:"Ko‘p tarmoqli markaziy poliklinika",OP:"Oilaviy poliklinika"')}};`
  );

  out=out.replace(
    /const ICS=\{([^}]+)\},ICT=\{\};/,
    (m,inner)=>inner.includes('KTMP:')?m:`const ICS={${inner.replace('OP:4.4','KTMP:4.9,OP:4.4').replace('OP:4.2','KTMP:4.9,OP:4.2')}},ICT={};`
  );

  out=out.replace(
    "const dccLegend=(u)=>{const types=[['TTB','🟨'],['SHTB','🟧'],['OP','✚'],['OShP','✚']]",
    "const dccLegend=(u)=>{const types=[['TTB','🟨'],['SHTB','🟧'],['KTMP','✚'],['OP','✚'],['OShP','✚']]"
  );

  return out+`\n<!-- ${LEADERSHIP_KTMP_MARKER} -->`;
}
