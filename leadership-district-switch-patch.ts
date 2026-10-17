export const LEADERSHIP_DISTRICT_SWITCH_MARKER = 'BUXORO_LEADERSHIP_DISTRICT_SWITCH_V2';

export function patchLeadershipDistrictSwitch(input: string): string {
  if (!input || input.includes(LEADERSHIP_DISTRICT_SWITCH_MARKER)) return input;

  const source = `DATA.forEach(d=>{if(own.has(d.n))return;REG[d.n].forEach(o=>{plate(o,.6,[nT,nS],det);line(loopPts(o.r),.68,0x2a6aa8,.6)})});`;
  const replacement = `DATA.forEach(d=>{if(own.has(d.n))return;REG[d.n].forEach(o=>{const nm=plate(o,.6,[nT,nS],det);nm.userData={u:(U2[d.n]&&U2[d.n].key)||d.n};detM.push(nm);line(loopPts(o.r),.68,0x2a6aa8,.6)})});`;

  if (!input.includes(source)) return input;

  return input.replace(
    source,
    `// ${LEADERSHIP_DISTRICT_SWITCH_MARKER}\n${replacement}`
  );
}
