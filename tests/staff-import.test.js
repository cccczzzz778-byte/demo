const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeStaffRows, TEMPLATE_HEADERS } = require('../lib/staff-import');
const validPinfl = '1'.repeat(14);

test('normalizes a valid row using required medical staff columns', () => {
  const rows = [{'Ходимнинг Ф.И.О.':'Test Xodim','ПИНФЛ':validPinfl,'Лавозими':'Shifokor','Мутахассислиги':'Terapevt','Ставкаси (ўриндош, асосий)':'1'}];
  const result = normalizeStaffRows(rows);
  assert.equal(TEMPLATE_HEADERS.length, 11);
  assert.equal(result.valid.length, 1);
  assert.equal(result.valid[0].pinfl, validPinfl);
  assert.equal(result.valid[0].employment, '1');
  assert.equal(result.errors.length, 0);
});

test('accepts comma decimal employment rate and normalizes it', () => {
  const result = normalizeStaffRows([{'Ходимнинг Ф.И.О.':'Test Xodim','ПИНФЛ':'2'.repeat(14),'Лавозими':'Shifokor','Ставкаси (ўриндош, асосий)':'0,5'}]);
  assert.equal(result.valid.length, 1);
  assert.equal(result.valid[0].employment, '0.5');
  assert.equal(result.errors.length, 0);
});

test('rejects non-numeric employment rate', () => {
  const result = normalizeStaffRows([{'Ходимнинг Ф.И.О.':'Test Xodim','ПИНФЛ':'3'.repeat(14),'Лавозими':'Shifokor','Ставкаси (ўриндош, асосий)':'asosiy'}]);
  assert.equal(result.valid.length, 0);
  assert.match(result.errors[0].message, /Stavka/);
});

test('rejects rows whose PINFL is not exactly 14 digits', () => {
  const result = normalizeStaffRows([{'Ходимнинг Ф.И.О.':'Test Xodim','ПИНФЛ':'123','Лавозими':'Shifokor','Ставкаси (ўриндош, асосий)':'1'}]);
  assert.equal(result.valid.length, 0);
  assert.match(result.errors[0].message, /14/);
});

test('rejects duplicate PINFL values inside uploaded rows', () => {
  const result = normalizeStaffRows([
    {'Ходимнинг Ф.И.О.':'Test One','ПИНФЛ':validPinfl,'Лавозими':'Shifokor','Ставкаси (ўриндош, асосий)':'1'},
    {'Ходимнинг Ф.И.O.':'Test Two','ПИНФЛ':validPinfl,'Лавозими':'Shifokor','Ставкаси (ўриндош, асосий)':'0,5'}
  ]);
  assert.equal(result.valid.length, 1);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].message, /takror/);
});
