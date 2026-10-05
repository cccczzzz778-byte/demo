const test=require('node:test');
const assert=require('node:assert/strict');
const {resolveJwtSecret,LOGIN_RATE_LIMIT}=require('../lib/security');

test('production requires JWT secret',()=>{
  assert.throws(()=>resolveJwtSecret({NODE_ENV:'production'}),/JWT_SECRET/);
});

test('production returns configured JWT secret',()=>{
  assert.equal(resolveJwtSecret({NODE_ENV:'production',JWT_SECRET:'configured-secret'}),'configured-secret');
});

test('development gets explicit non-production fallback',()=>{
  assert.equal(typeof resolveJwtSecret({NODE_ENV:'test'}),'string');
  assert.ok(resolveJwtSecret({NODE_ENV:'test'}).length>0);
});

test('login rate limit is finite and positive',()=>{
  assert.ok(Number.isFinite(LOGIN_RATE_LIMIT.windowMs));
  assert.ok(LOGIN_RATE_LIMIT.windowMs>0);
  assert.ok(Number.isFinite(LOGIN_RATE_LIMIT.limit));
  assert.ok(LOGIN_RATE_LIMIT.limit>0);
});
