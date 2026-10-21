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
