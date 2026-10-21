import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHash, hashFor } from '../../js/router.js';

test('parseHash', () => {
  for (const k of ['work', 'coffee', 'trade', 'about', 'contact']) assert.equal(parseHash('#' + k), k);
  for (const h of ['', '#', '#home', '#top', '#foo', '#Work', '#work/x']) assert.equal(parseHash(h), null);
});

test('hashFor', () => {
  assert.equal(hashFor('trade'), '#trade');
  assert.equal(hashFor(null), '');
});
