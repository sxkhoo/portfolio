import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LAYOUTS, pickLayout } from '../../js/layout.js';

test('pickLayout', () => {
  assert.equal(pickLayout(1440, 900), 'landscape');
  assert.equal(pickLayout(1035, 900), 'landscape'); // exactly 1.15
  assert.equal(pickLayout(1024, 900), 'portrait');
  assert.equal(pickLayout(390, 844), 'portrait');
});

test('every layout places every scene object', () => {
  for (const name of ['landscape', 'portrait'])
    assert.deepEqual(Object.keys(LAYOUTS[name].objects).sort(), ['ball', 'beans', 'envelope', 'kettle', 'laptop', 'pencil', 'phone', 'pick', 'polaroid', 'v60']);
});

test('landscape matches the approved mockup', () => {
  const o = LAYOUTS.landscape.objects;
  assert.deepEqual(LAYOUTS.landscape.viewBox, [0, 0, 1600, 1000]);
  assert.deepEqual(LAYOUTS.landscape.mat, [168, 58, 914, 884]);
  assert.deepEqual([o.laptop.x, o.laptop.y, o.laptop.r], [560, 130, 0]);
  assert.deepEqual([o.phone.x, o.phone.y, o.phone.r], [250, 120, -10]);
  assert.deepEqual([o.polaroid.x, o.polaroid.y, o.polaroid.r], [205, 490, 6]);
  assert.deepEqual([o.envelope.x, o.envelope.y, o.envelope.r], [1110, 700, -5]);
  assert.deepEqual([o.v60.x, o.v60.y], [1250, 268]);
});
