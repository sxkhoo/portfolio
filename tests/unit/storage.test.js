import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getStorage, introSeen, markIntroSeen } from '../../js/storage.js';

const fakeStorage = () => {
  const m = new Map();
  return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)) };
};

test('intro flag round-trips', () => {
  const s = fakeStorage();
  assert.equal(introSeen(s), false);
  markIntroSeen(s);
  assert.equal(s.getItem('ksx-viewfinder-intro-v1'), '1');
  assert.equal(introSeen(s), true);
});

test('broken or missing storage means "not seen" and never throws', () => {
  const boom = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.equal(introSeen(boom), false);
  assert.doesNotThrow(() => markIntroSeen(boom));
  assert.equal(introSeen(null), false);
  assert.doesNotThrow(() => markIntroSeen(null));
  assert.equal(getStorage({ get localStorage() { throw new Error('denied'); } }), null);
});

test('getStorage returns the window storage when it is reachable', () => {
  const s = fakeStorage();
  assert.equal(getStorage({ localStorage: s }), s);
});
