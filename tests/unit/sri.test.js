import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const GSAP_SRI = 'sha512-7eHRwcbYkK4d9g/6tD/mhkf++eoTHwpNM9woBxtPUBWm67zeAfFC+HrdoE2GanKeocly/VxeLvIqwvCdk7qScg==';

// e2e serves this npm copy in place of the cdnjs file, so it must match the pinned hash
test('npm gsap 3.12.5 is byte-identical to the cdnjs build we pin', () => {
  const buf = readFileSync(new URL('../node_modules/gsap/dist/gsap.min.js', import.meta.url));
  const sri = 'sha512-' + createHash('sha512').update(buf).digest('base64');
  assert.equal(sri, GSAP_SRI);
});
