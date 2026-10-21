// Desk geometry. Objects are drawn in local coordinates; each layout places them
// with translate(x y) rotate(r) scale(s). This is the only place tilt lives.

export const PORTRAIT_BELOW = 1.15;

export const LAYOUTS = {
  landscape: {
    viewBox: [0, 0, 1600, 1000],
    mat: [168, 58, 914, 884],
    objects: {
      ball: { x: 30, y: 300, r: 0 },
      phone: { x: 250, y: 120, r: -10 },
      laptop: { x: 560, y: 130, r: 0 },
      polaroid: { x: 205, y: 490, r: 6 },
      pick: { x: 600, y: 820, r: 18 },
      pencil: { x: 700, y: 842, r: -6 },
      beans: { x: 1120, y: 300, r: 0 },
      v60: { x: 1250, y: 268, r: 0 },
      kettle: { x: 1278, y: 566, r: 0 },
      envelope: { x: 1110, y: 700, r: -5 },
    },
  },
  // tall screens: the same objects stacked; the bottom quarter stays clear for the name
  portrait: {
    viewBox: [0, 0, 1000, 1600],
    mat: [70, 60, 860, 1130],
    objects: {
      ball: { x: 60, y: 200, r: 0, s: 0.8 },
      laptop: { x: 284, y: 90, r: 0, s: 0.9 },
      pick: { x: 860, y: 300, r: 18 },
      beans: { x: 860, y: 560, r: 0 },
      phone: { x: 150, y: 680, r: -10, s: 0.9 },
      v60: { x: 700, y: 760, r: 0, s: 0.9 },
      polaroid: { x: 470, y: 900, r: 6, s: 0.9 },
      envelope: { x: 180, y: 990, r: -5, s: 0.85 },
      kettle: { x: 800, y: 1040, r: 0, s: 0.8 },
      pencil: { x: 300, y: 1160, r: -6, s: 0.8 },
    },
  },
};

export function pickLayout(width, height) {
  return width / height < PORTRAIT_BELOW ? 'portrait' : 'landscape';
}
