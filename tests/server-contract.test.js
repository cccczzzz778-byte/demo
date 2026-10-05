const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

test('runtime start path does not use patch scripts',()=>{
  assert.doesNotMatch(pkg.scripts.start,/patch-ui\.js|patch-server\.js/);
});

test('server enables baseline security middleware',()=>{
  assert.match(server,/require\(['"]helmet['"]\)/);
  assert.match(server,/require\(['"]express-rate-limit['"]\)/);
  assert.match(server,/app\.use\(helmet\(/);
});

test('server resolves JWT secret through security helper',()=>{
  assert.match(server,/resolveJwtSecret\(process\.env\)/);
  assert.doesNotMatch(server,/change-this-secret/);
});

test('login route is protected by a rate limiter',()=>{
  assert.match(server,/app\.post\(['"]\/api\/login['"],\s*loginLimiter/);
});

test('server uses centralized validators for mutable records',()=>{
  assert.match(server,/validateStaffInput/);
  assert.match(server,/validateInstitutionInput/);
  assert.match(server,/validateAccountInput/);
});

test('server serves static frontend directly without source rewriting',()=>{
  assert.doesNotMatch(server,/fs\.readFileSync|readFileSync\(.*public.*index\.html/);
  assert.doesNotMatch(server,/importUiScript|patch-ui\.js|patch-server\.js/);
  assert.match(server,/express\.static\(path\.join\(__dirname,'public'\)/);
});
