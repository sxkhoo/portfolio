// Desk geometry. Objects are drawn in local coordinates; each layout places them
// with translate(x y) rotate(r) scale(s). This is the only place tilt lives.
// Both layouts use "meet" so the whole desk is always on screen; the wood is drawn
// far past the viewBox, so letterboxing just shows more desk.

export const PORTRAIT_BELOW = 1.15;

export const LAYOUTS = {
  landscape: {
    viewBox: [0, 0, 1600, 1000],
    aspect: 'xMidYMid meet',
    mat: [168, 58, 914, 884],
    objects: {
      ball: { x: 30, y: 300, r: 0 },
      phone: { x: 250, y: 120, r: -10 },
      laptop: { x: 560, y: 130, r: 0 },
      polaroid: { x: 205, y: 490, r: 6 },
      pick: { x: 600, y: 820, r: 18 },
      pencil: { x: 700, y: 842, r: -6 },
      beans: { x: 1450, y: 420, r: 0 },
      v60: { x: 1250, y: 268, r: 0 },
      kettle: { x: 1278, y: 566, r: 0 },
      envelope: { x: 1110, y: 700, r: -5 },
    },
  },
  // tall screens: the same objects stacked, desk pinned to the top so the
  // name block at the bottom never covers them
  portrait: {
    viewBox: [0, -200, 1000, 1990],
    aspect: 'xMidYMin meet',
    mat: [50, -50, 900, 1390],
    objects: {
      ball: { x: 40, y: 120, r: 0, s: 0.8 },
      laptop: { x: 284, y: 40, r: 0, s: 0.9 },
      pick: { x: 880, y: 150, r: 18 },
      beans: { x: 870, y: 450, r: 0 },
      phone: { x: 90, y: 640, r: -8, s: 0.9 },
      kettle: { x: 440, y: 760, r: 0, s: 0.75 },
      v60: { x: 690, y: 760, r: 0, s: 0.9 },
      polaroid: { x: 110, y: 990, r: 6, s: 0.9 },
      envelope: { x: 540, y: 1010, r: -5, s: 0.9 },
      pencil: { x: 250, y: 1290, r: -6, s: 0.8 },
    },
  },
};

export function pickLayout(width, height) {
  return width / height < PORTRAIT_BELOW ? 'portrait' : 'landscape';
}
