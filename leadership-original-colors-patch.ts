export const ORIGINAL_COLORS_MARKER='BUXORO_SSB_ORIGINAL_MAP_COLORS_V1';

export function patchOriginalMapColors(input:string):string{
  if(!input||input.includes(ORIGINAL_COLORS_MARKER))return input;
  let html=input;
  html=html.replace(
    'const col=new THREE.Color(DISTRICT_COLORS[d.n]||0x88b7e8);',
    'const col=city?new THREE.Color(0x8aeeff):c1.clone().lerp(c2,(VAL[d.n]-35)/60);'
  );
  html=html.replace(
    'ribbon(lp,h,city?5:3.2,districtStatusColor(d.n));',
    'ribbon(lp,h,city?5:3.2,city?0xffffff:0x27d8ff);'
  );
  const marker=`<meta name="buxoro-original-map-colors" content="${ORIGINAL_COLORS_MARKER}">`;
  if(html.includes('</head>'))html=html.replace('</head>',marker+'</head>');
  else html=marker+html;
  return html;
}
