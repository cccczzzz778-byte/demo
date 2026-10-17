import { describe, expect, test } from 'bun:test';
import { enhanceAdminShell } from '../super-admin-ui-actions.ts';

describe('Super Admin CSP styling',()=>{
  test('runtime enhancer adds the CSP nonce placeholder to inline admin styles',()=>{
    const html=enhanceAdminShell('<html><head><style>body{}</style></head><body></body></html>',{
      username:'admin',role:'SUPER_ADMIN',scopeType:'province',districtId:null,controlMode:null,active:true
    } as any);
    expect(html).toContain('<style nonce="__CSP_NONCE__">');
  });
});
