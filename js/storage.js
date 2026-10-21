// Remembers that a visitor has seen the opening. Storage can be missing or throw
// (private mode, blocked cookies); every failure reads as "not seen", so the
// opening simply plays again — the specified fallback.

import { INTRO_KEY } from './config.js';

export function getStorage(win) {
  try {
    return win.localStorage;
  } catch {
    return null;
  }
}

export function introSeen(storage) {
  try {
    return storage?.getItem(INTRO_KEY) === '1';
  } catch {
    return false;
  }
}

export function markIntroSeen(storage) {
  try {
    storage?.setItem(INTRO_KEY, '1');
  } catch {
    // unavailable storage: the opening plays again next visit, by design
  }
}
