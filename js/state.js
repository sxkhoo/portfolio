// Navigation state. Pure reducer: returns the same object when an event is ignored.
//
// modes: intro | desk | opening | section | closing | hopping
// pending: a route queued during a move — undefined (none), null (desk) or a section key

import { ORDER } from './config.js';

const MOVES = new Set(['intro', 'opening', 'closing', 'hopping']);
const valid = key => ORDER.includes(key);
const to = (mode, key = null, from = null) => ({ mode, key, from, pending: undefined });

export function initialState(mode = 'desk', key = null) {
  return to(mode, key);
}

// once a move lands, apply whatever route arrived while it ran
const settle = (state, pending) => pending === undefined ? state : reduce(state, { type: 'ROUTE', target: pending });

export function reduce(state, event) {
  const { mode, key } = state;

  if (event.type === 'ROUTE') {
    const target = valid(event.target) ? event.target : null;
    if (MOVES.has(mode)) return { ...state, pending: target };
    if (mode === 'desk') return target ? to('opening', target) : state;
    if (target === key) return state;
    return target ? to('hopping', target, key) : to('closing', key);
  }

  switch (mode) {
    case 'intro':
      return event.type === 'INTRO_DONE' ? settle(to('desk'), state.pending) : state;
    case 'desk':
      return event.type === 'OPEN' && valid(event.key) ? to('opening', event.key) : state;
    case 'opening':
    case 'hopping':
      return event.type === 'ARRIVED' ? settle(to('section', key), state.pending) : state;
    case 'closing':
      return event.type === 'ARRIVED' ? settle(to('desk'), state.pending) : state;
    case 'section':
      if (event.type === 'CLOSE') return to('closing', key);
      if (event.type === 'HOP') return to('hopping', ORDER[(ORDER.indexOf(key) + event.dir + ORDER.length) % ORDER.length], key);
      if (event.type === 'JUMP' && valid(event.key) && event.key !== key) return to('hopping', event.key, key);
      return state;
    default:
      return state;
  }
}
