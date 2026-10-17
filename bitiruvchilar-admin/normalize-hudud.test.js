const test = require('node:test');
const assert = require('node:assert/strict');
const { canonicalHudud } = require('./normalize-hudud');

test('lotincha Buxoro shahri canonical krillga aylanadi', () => {
  assert.equal(canonicalHudud('Buxoro shahri'), 'Бухоро шаҳар');
});

test("G'ijduvon va Qorako'l variantlari canonical krillga aylanadi", () => {
  assert.equal(canonicalHudud("G'ijduvon"), 'Ғиждувон тумани');
  assert.equal(canonicalHudud("Qorako'l tumani"), 'Қоракўл тумани');
});
