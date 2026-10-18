export const INSTITUTION_SCOPE_MARKER='BUXORO_SSB_INSTITUTION_SCOPE_V2';

export function patchInstitutionScope(input:string):string{
  if(!input||input.includes(INSTITUTION_SCOPE_MARKER))return input;
  let html=input;

  html=html.replaceAll("G'ijduvon TTB","G'ijduvon SSB");
  html=html.replaceAll(',"MP",',',"KTMP",');

  html=html.replace(
    /const TY=\{[^;]+\};/,
    'const TY={V:["DPM",0xb48cff,0x3a1f7a,1.5,8,1,0],TTB:["TTB",0xffc83d,0x8a5a00,1.5,9,1,1],SHTB:["SHTB",0xff7a3d,0x7a2a00,1.5,11,1,1],KTMP:["KTMP",0x2dd4ff,0x0b5d73,1.1,5.2,1,0],OP:["OP",0x35f0a0,0x0a6a40,.9,4,1,0],OShP:["OShP",0x3fa8ff,0x0a3a7a,.8,3,0,0]};'
  );

  html=html.replace(
    /const TFULL=\{[^;]+\};/,
    'const TFULL={V:"DPM · viloyat darajasidagi muassasa",TTB:"Tuman tibbiyot birlashmasi",SHTB:"Shahar tibbiyot birlashmasi",KTMP:"Ko‘p tarmoqli markaziy poliklinika",OP:"Oilaviy poliklinika",OShP:"Oilaviy shifokorlik punkti"};'
  );

  html=html.replace(
    /const ICS=\{[^;]+\},THR=\{[^;]+\},ICT=\{\};/,
    'const ICS={V:5.8,TTB:5.2,SHTB:5.8,KTMP:4.9,OP:4.2,OShP:3.8},THR={V:1e9,TTB:1e9,SHTB:1e9,KTMP:1e9,OP:1e9,OShP:1e9},ICT={};'
  );

  if(!html.includes("const P=IDATA.filter(d=>['V','TTB','SHTB','KTMP','OP','OShP'].includes(d[1])).map(")){
    html=html.replace(
      /const P=IDATA(?:\.filter\([^\n;]+\))?\.map\(/,
      "const P=IDATA.filter(d=>['V','TTB','SHTB','KTMP','OP','OShP'].includes(d[1])).map("
    );
  }

  const nonce=html.match(/nonce=[\"']([^\"']+)[\"']/)?.[1]||'';
  const nonceAttr=nonce?` nonce=\"${nonce}\"`:'';
  const meta=`<meta name=\"buxoro-institution-scope\" content=\"${INSTITUTION_SCOPE_MARKER}\">`;
  if(html.includes('</head>'))html=html.replace('</head>',meta+'</head>');
  else html+=`<span${nonceAttr} data-scope=\"${INSTITUTION_SCOPE_MARKER}\"></span>`;

  return html;
}
