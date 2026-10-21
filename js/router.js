// Hash routes: '#work' … '#contact' are sections; anything else is the desk.

import { ORDER } from './config.js';

export function parseHash(hash) {
  const key = hash.slice(1);
  return ORDER.includes(key) ? key : null;
}

export function hashFor(key) {
  return key ? '#' + key : '';
}
