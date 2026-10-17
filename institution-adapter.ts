import { authorize, type AccessProfile } from './rbac.ts';

export type LegacyInstitutionRow={id:string;name:string;type:string;scope:string|null;parent_id?:string|null};
export type InstitutionNode={id:string;name:string;type:string;scope:string|null;parentId:string|null;district:string|null;level:'province'|'district';isDpm:boolean};

export function normalizeInstitution(row:LegacyInstitutionRow):InstitutionNode{
  const isDpm=row.type==='DPM';
  return {id:row.id,name:row.name,type:row.type,scope:row.scope??null,parentId:isDpm?null:(row.parent_id??null),district:isDpm?null:(row.scope??null),level:isDpm?'province':'district',isDpm};
}

export function scopeInstitutions(rows:LegacyInstitutionRow[],profile:AccessProfile):LegacyInstitutionRow[]{
  return rows.filter(row=>{const n=normalizeInstitution(row);return authorize(profile,'VIEW',{district:n.district,facilityId:n.id,isDpm:n.isDpm}).allowed});
}

export function buildHierarchy(rows:LegacyInstitutionRow[],profile:AccessProfile){
  const scoped=scopeInstitutions(rows,profile).map(normalizeInstitution);
  const dpms=scoped.filter(x=>x.isDpm);
  const districts=[...new Set(scoped.filter(x=>!x.isDpm&&x.district).map(x=>x.district!))].sort();
  return {dpms,districts:districts.map(district=>{
    const inDistrict=scoped.filter(x=>!x.isDpm&&x.district===district);
    const centers=inDistrict.filter(x=>x.type==='TTB'||x.type==='SHTB').map(c=>({...c,children:inDistrict.filter(x=>x.parentId===c.id&&(x.type==='OP'||x.type==='OSHP'||x.type==='KTMP'))}));
    const centerIds=new Set(centers.map(x=>x.id));
    const unassigned=inDistrict.filter(x=>!['TTB','SHTB'].includes(x.type)&&(!x.parentId||!centerIds.has(x.parentId)));
    return {district,centers,unassigned};
  })};
}
