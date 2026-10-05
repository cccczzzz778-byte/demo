const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeStaffRows, TEMPLATE_HEADERS } = require('../lib/staff-import');
const validPinfl = '1'.repeat(14);

test('normalizes a valid row using required medical staff columns', () => {
  const rows = [{'Ходимнинг Ф.И.О.':'Test Xodim','ПИНФЛ':validPinfl,'Лавозими':'Shifokor','Мутахассислиги':'Terapevt'}];
  const result = normalizeStaffRows(rows);
  assert.equal(TEMPLATE_HEADERS.length, 11);
  assert.equal(result.valid.length, 1);
  assert.equal(result.valid[0].pinfl, validPinfl);
  assert.equal(result.errors.length, 0);
});

test('rejects rows whose PINFL is not exactly 14 digits', () => {
  const result = normalizeStaffRows([{'Ходимнинг Ф.И.О.':'Test Xodim','ПИНФЛ':'123','Лавозими':'Shifokor'}]);
  assert.equal(result.valid.length, 0);
  assert.match(result.errors[0].message, /14/);
});

test('rejects duplicate PINFL values inside uploaded rows', () => {
  const result = normalizeStaffRows([
    {'Ходимнинг Ф.И.О.':'Test One','ПИНФЛ':validPinfl,'Лавозими':'Shifokor'},
    {'Ходимнинг Ф.И.О.':'Test Two','ПИНФЛ':validPinfl,'Лавозими':'Shifokor'}
  ]);
  assert.equal(result.valid.length, 1);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].message, /takror/);
});
