// Regenerates the responsive photo from pfp.jpg. Run from the repo root:
//   node tests/scripts/images.mjs
import sharp from 'sharp';

const src = new URL('../../pfp.jpg', import.meta.url).pathname;
// film grain compresses badly: the large size trades width for the 250 KB budget
for (const [width, quality] of [[1280, 78], [2048, 72]]) {
  const out = new URL(`../../img/pfp-${width}.webp`, import.meta.url).pathname;
  const info = await sharp(src).resize({ width }).webp({ quality, effort: 6 }).toFile(out);
  console.log(`img/pfp-${width}.webp ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)} KB`);
}

// soft shadow sprite: a blurred rounded rect, stretched under each flat object.
// SVG blur filters are far too slow once the camera zooms in; a bitmap scales for free.
// The rect spans 16..240 of 256, so placement inflates an object's box by 16/224 per side.
const sprite = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect x="16" y="16" width="224" height="224" rx="12"/></svg>';
await sharp(Buffer.from(sprite)).blur(6).png({ compressionLevel: 9 }).toFile(new URL('../../img/shadow.png', import.meta.url).pathname);
console.log('img/shadow.png');
