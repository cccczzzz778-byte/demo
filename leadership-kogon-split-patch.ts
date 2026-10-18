export const LEADERSHIP_KOGON_SPLIT_MARKER='BUXORO_LEADERSHIP_KOGON_SPLIT_V1';

export function patchLeadershipKogonSplit(input:string):string{
  if(!input||input.includes(LEADERSHIP_KOGON_SPLIT_MARKER)) return input;
  let out=input;

  // Source polygons are semantically reversed for Kogon: the large enclosing
  // polygon is stored as "Kogon shahri" and the tiny enclave as "Kogon".
  // Swap only DATA polygon names so the district gets the large outer shape
  // and the city gets the small enclave, while institution dist labels stay intact.
  out=out.replace(/"n":"Kogon"/g,'"n":"__KOGON_CITY_GEOM__"');
  out=out.replace(/"n":"Kogon shahri"/g,'"n":"Kogon"');
  out=out.replace(/"n":"__KOGON_CITY_GEOM__"/g,'"n":"Kogon shahri"');

  out=out.replace(
    'DATA.forEach(d=>{if(d.n==="Kogon"||d.n==="Kogon shahri"){if(!UNIT.Kogon)addU("Kogon","Kogon tumani va shahri",["Kogon shahri","Kogon"]);return}addU(d.n,d.n.endsWith("shahri")?d.n:d.n+" tumani",[d.n])});',
    'DATA.forEach(d=>{addU(d.n,d.n.endsWith("shahri")?d.n:d.n+" tumani",[d.n])});'
  );

  // Stop combining the two health-stat rows.
  out=out.replace(
    /const hsFind=u=>\{if\(!u\)return HEALTH_PROVINCE;if\(hsNorm\(u\.key\)==='kogon'\)\{[^;]+?return\{key:'Kogon tumani va shahri'[^}]+\}\};/,
    'const hsFind=u=>{if(!u)return HEALTH_PROVINCE;'
  );

  // Stop combining historical rows; direct key lookup now handles both.
  out=out.replace("if(n==='kogon')return 'Kogon combined';",'');

  // Remove old combined display labels in overview widgets if still present.
  out=out.replaceAll('Kogon (tuman+shahar)','Kogon');
  out=out.replaceAll('Kogon tumani va shahri','Kogon tumani');

  return out+`\n<!-- ${LEADERSHIP_KOGON_SPLIT_MARKER} -->`;
}
