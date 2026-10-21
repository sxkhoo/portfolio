import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reduce } from '../../js/state.js';

const pick = s => [s.mode, s.key];
const desk = initialState();

test('desk opens a section; spam during the move is ignored', () => {
  const s = reduce(desk, { type: 'OPEN', key: 'work' });
  assert.deepEqual([s.mode, s.key], ['opening', 'work']);
  for (const e of [{ type: 'OPEN', key: 'coffee' }, { type: 'CLOSE' }, { type: 'HOP', dir: 1 }, { type: 'JUMP', key: 'about' }])
    assert.equal(reduce(s, e), s);
  assert.deepEqual(pick(reduce(s, { type: 'ARRIVED' })), ['section', 'work']);
});

test('hop wraps in both directions', () => {
  assert.deepEqual(pick(reduce(initialState('section', 'contact'), { type: 'HOP', dir: 1 })), ['hopping', 'work']);
  assert.deepEqual(pick(reduce(initialState('section', 'work'), { type: 'HOP', dir: -1 })), ['hopping', 'contact']);
});

test('close returns to desk', () => {
  const c = reduce(initialState('section', 'trade'), { type: 'CLOSE' });
  assert.deepEqual(pick(c), ['closing', 'trade']);
  assert.deepEqual(pick(reduce(c, { type: 'ARRIVED' })), ['desk', null]);
});

test('a route during a move is queued and applied on arrival (last wins)', () => {
  let s = reduce(desk, { type: 'OPEN', key: 'work' });
  s = reduce(s, { type: 'ROUTE', target: 'coffee' });
  s = reduce(s, { type: 'ROUTE', target: null });
  assert.equal(s.pending, null);
  assert.deepEqual(pick(reduce(s, { type: 'ARRIVED' })), ['closing', 'work']);
});

test('route during intro opens after INTRO_DONE', () => {
  const s = reduce(initialState('intro'), { type: 'ROUTE', target: 'about' });
  assert.deepEqual(pick(reduce(s, { type: 'INTRO_DONE' })), ['opening', 'about']);
});

test('routes to the current place and same-key jumps are ignored', () => {
  const sec = initialState('section', 'work');
  assert.equal(reduce(sec, { type: 'ROUTE', target: 'work' }), sec);
  assert.equal(reduce(sec, { type: 'JUMP', key: 'work' }), sec);
  assert.equal(reduce(desk, { type: 'ROUTE', target: null }), desk);
});

test('routes from section map to close and hop', () => {
  assert.deepEqual(pick(reduce(initialState('section', 'work'), { type: 'ROUTE', target: null })), ['closing', 'work']);
  const h = reduce(initialState('section', 'work'), { type: 'ROUTE', target: 'about' });
  assert.deepEqual([h.mode, h.key, h.from], ['hopping', 'about', 'work']);
});

test('unknown keys are ignored', () => {
  assert.equal(reduce(desk, { type: 'OPEN', key: 'nope' }), desk);
});
