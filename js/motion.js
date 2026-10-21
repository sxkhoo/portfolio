// All animation goes through one Motion interface:
//   { animated, intro, reveal, open, close, hop, frame, finish }
// The static driver is used for reduced motion or when GSAP didn't load:
// no camera moves, no opening — sections just fade.

const done = () => Promise.resolve();

function staticMotion({ boxes }) {
  return {
    animated: false,
    intro: done,
    reveal() { boxes.setVisible(true); return done(); },
    open() { boxes.setVisible(false); return done(); },
    close: done,
    hop: done,
    frame() {},
    finish() {},
  };
}

export function createMotion(deps) {
  return staticMotion(deps);
}
