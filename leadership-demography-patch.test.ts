import { describe, expect, test } from 'bun:test';
import { patchLeadershipDemography } from './leadership-demography-patch.ts';

const source = `<!doctype html><html><head><style></style></head><body><div id="L"></div><div id="R"></div><script>let cur=null;const UL=[];let renderOv=()=>{};let renderUnit=()=>{};function home(){};home();fly=false;loop();</script></body></html>`;

describe('leadership demography patch', () => {
  test('adds demographic data and overrides overview/detail renderers without removing the 3D runtime anchor', () => {
    const out = patchLeadershipDemography(source);
    expect(out).toContain('BUXORO_LEADERSHIP_DEMOGRAPHY_V2');
    expect(out).toContain('2117200');
    expect(out).toContain('renderOv=function');
    expect(out).toContain('renderUnit=function');
    expect(out).toContain('home();fly=false;loop();');
  });
});
