import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { DISTRICT_PALETTE, HOUSE_COUNTS, PATCH_MARKER, patchLeadership3d } from '../leadership-3d-patch.ts';

const fixture=readFileSync(new URL('./fixtures/leadership-markers.html',import.meta.url),'utf8');

describe('leadership 3D patch',()=>{
 test('exports pinned pastel palette and deterministic house counts',()=>{
  expect(DISTRICT_PALETTE).toEqual({
   'Buxoro':0x88B7E8,'Buxoro shahri':0x8EDBE8,'Kogon':0xB9A8E8,'Kogon shahri':0xE7CC91,
   'Olot':0x91D3C4,"Qorako'l":0x9AAAE5,'Jondor':0x95D2B8,'Peshku':0xA4CDE7,
   'Vobkent':0xD8D39A,"G'ijduvon":0xD3A6D8,'Shofirkon':0xE4B18F,'Romitan':0xBCA9DF,'Qorovulbozor':0xE3A0A8,
  });
  expect(HOUSE_COUNTS).toEqual({TTB:10,SHTB:10,OP:5,OShP:4});
 });
 test('is idempotent and preserves current leadership UX/hardened features',()=>{
  const once=patchLeadership3d(fixture);const twice=patchLeadership3d(once);
  expect(once).toContain(PATCH_MARKER);expect(twice).toBe(once);
  expect(once).toContain('Bugungi holat');expect(once).toContain('applyDistrictFocus');
  expect(once).toContain('districtStatusColor');expect(once).toContain('buildSSBHeadquarters');
 });
 test('uses pastel base colors while status remains separate and cities are forced visible/selectable',()=>{
  const h=patchLeadership3d(fixture);
  expect(h).toContain('0x8edbe8');expect(h).toContain('0xe7cc91');
  expect(h).toContain('districtStatusColor');expect(h).toContain('0x25e06a');expect(h).toContain('0xffc83d');expect(h).toContain('0xff5b6e');
  expect(h).toContain('function ensureCityVisibility');expect(h).toContain('Buxoro shahri');expect(h).toContain('Kogon shahri');expect(h).toContain('zIndex');
 });
 test('redesigns TTB/SHTB and builds polygon-safe neighborhoods at pinned counts',()=>{
  const h=patchLeadership3d(fixture);
  expect(h).toContain('function buildDistrictMedicalCenters');expect(h).toContain('TTB');expect(h).toContain('SHTB');
  expect(h).toContain('safePointInPolygon');expect(h).toContain('HOUSE_COUNTS_3D');
  expect(h).toContain('TTB:10');expect(h).toContain('SHTB:10');expect(h).toContain('OP:5');expect(h).toContain('OShP:4');
  expect(h).toContain('districtLabel');
 });
 test('replaces outward center flow with bounded OP/OShP -> district center -> SSB flow',()=>{
  const h=patchLeadership3d(fixture);
  expect(h).not.toContain('flow arcs from Buxoro SHTB to every TTB/SHTB');
  expect(h).toContain('function resolveDistrictCenter');expect(h).toContain('function buildHierarchicalFlows');expect(h).toContain('function animateHierarchicalFlows');
  expect(h).toContain("facility-to-district");expect(h).toContain("district-to-ssb");
  expect(h).toContain('MAX_FLOW_EDGES=180');expect(h).toContain('animateHierarchicalFlows(T)');
  expect(h).toContain('I.type==="OP"||I.type==="OShP"');
 });
 test('adds center focus and a single Home reset function',()=>{
  const h=patchLeadership3d(fixture);
  expect(h).toContain('function applyCenterFocus');expect(h).toContain('function resetMapFocus');
  expect(h).toContain('applyCenterFocus(I)');expect(h).toContain('resetMapFocus()');
  expect(h).toContain('applyDistrictFocus(n)');
 });
});
