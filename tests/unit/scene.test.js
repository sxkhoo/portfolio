import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { photoHref } from '../../js/scene.js';

test('photoHref picks the large photo only when the screen needs it', () => {
  assert.equal(photoHref(1440, 2), 'img/pfp-2048.webp');
  assert.equal(photoHref(1024, 1), 'img/pfp-1280.webp');
  assert.equal(photoHref(800, 2), 'img/pfp-1280.webp'); // exactly 1600 device px
});

test('the large photo stays within budget', () => {
  assert.ok(statSync(new URL('../../img/pfp-2048.webp', import.meta.url)).size <= 250_000);
});
